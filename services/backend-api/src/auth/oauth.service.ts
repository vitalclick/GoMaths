import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { OAuthCompleteDto, OAuthSignInDto } from "./auth.dto";
import { AuthService, type AuthSession } from "./auth.service";
import { verifyIdToken, type OAuthProvider, type VerifiedIdentity } from "./oauth-verifier";
import { ParentalConsentService } from "./parental-consent.service";
import { UsersService } from "./users.service";

/**
 * Social sign-in (Google / Apple).
 *
 * The client runs the provider flow natively and hands us the resulting
 * OIDC ID token; we never see the provider's authorization code or secret,
 * so there is no client secret to keep on device.
 *
 * Two-step because the providers can't give us everything a GoMaths
 * account needs. They return an email and (sometimes) a name — but the
 * curriculum needs a grade, and POPIA needs a birth year plus parental
 * consent for under-18s. So a *first* sign-in doesn't create anything:
 *
 *   POST /auth/oauth            → { status: "profile_required", signupToken }
 *   POST /auth/oauth/complete   → { status: "authenticated", session }
 *
 * The signup token is a short-lived JWT carrying the already-verified
 * provider identity. That keeps the second call cheap (no second round
 * trip to Google/Apple) while making it impossible for a client to claim
 * an identity we never verified — the token is signed by us.
 *
 * A returning learner short-circuits: their AuthIdentity row already
 * exists, so the first call returns a session directly.
 *
 * Account linking: if the provider asserts a *verified* email that already
 * belongs to a User, we attach the identity to that account rather than
 * failing with "email already registered". Unverified emails are never
 * linked — that is the classic pre-registration account-takeover hole.
 */
@Injectable()
export class OauthService {
  private static readonly SIGNUP_TTL_MS = 20 * 60 * 1000;
  private static readonly SIGNUP_PURPOSE = "oauth.signup";

  private readonly logger = new Logger(OauthService.name);
  private readonly audiences: Record<OAuthProvider, string[]>;
  private readonly signupSecret: string;

  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly consent: ParentalConsentService,
    config: ConfigService,
  ) {
    this.audiences = {
      google: parseClientIds(config.get<string>("GOOGLE_OAUTH_CLIENT_IDS", "")),
      apple: parseClientIds(config.get<string>("APPLE_OAUTH_CLIENT_IDS", "")),
    };
    this.signupSecret = config.get<string>(
      "OAUTH_SIGNUP_SECRET",
      config.get<string>("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
    );
  }

  /** Providers this deployment has client IDs for — the app hides the rest. */
  enabledProviders(): OAuthProvider[] {
    return (Object.keys(this.audiences) as OAuthProvider[]).filter(
      (p) => this.audiences[p].length > 0,
    );
  }

  async signIn(dto: OAuthSignInDto): Promise<OAuthSignInResult> {
    const identity = await verifyIdToken(dto.provider, dto.idToken, {
      audiences: this.audiences[dto.provider],
      nonce: dto.nonce,
    });

    const existingByProvider = await this.users.findByProviderIdentity(
      identity.provider,
      identity.subject,
    );
    if (existingByProvider) {
      await this.users.touchProviderIdentity(identity.provider, identity.subject);
      return { status: "authenticated", session: await this.auth.issueSession(existingByProvider) };
    }

    // Apple only sends the name on the very first authorisation, and only
    // to the client — never in the ID token. So the client forwards it.
    const displayName = pickDisplayName(identity, dto.displayName);

    if (identity.email) {
      const existingByEmail = await this.users.findByEmail(identity.email);
      if (existingByEmail) {
        if (!identity.emailVerified) {
          throw new UnauthorizedException(
            "That email already has a GoMaths account. Sign in with your password to link this provider.",
          );
        }
        await this.users.linkProviderIdentity(existingByEmail.id, identity);
        this.logger.log(
          `Linked ${identity.provider} identity to existing user ${existingByEmail.id}`,
        );
        return { status: "authenticated", session: await this.auth.issueSession(existingByEmail) };
      }
    }

    const expiresAt = new Date(Date.now() + OauthService.SIGNUP_TTL_MS);
    const signupToken = await this.jwt.signAsync(
      {
        purpose: OauthService.SIGNUP_PURPOSE,
        provider: identity.provider,
        sub: identity.subject,
        email: identity.email,
        emailVerified: identity.emailVerified,
        name: displayName,
      },
      {
        secret: this.signupSecret,
        expiresIn: Math.floor(OauthService.SIGNUP_TTL_MS / 1000),
      },
    );

    return {
      status: "profile_required",
      signupToken,
      email: identity.email,
      displayName,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Second leg: the learner has told us their grade and birth year (and,
   * if they're a minor, their parent has confirmed). Creates the User +
   * Student + AuthIdentity rows and issues the session.
   */
  async complete(dto: OAuthCompleteDto): Promise<{ status: "authenticated"; session: AuthSession }> {
    const ticket = await this.verifySignupToken(dto.signupToken);

    // The provider may not have given us an email (Apple users can decline
    // to share one). We can't run the consent flow or dedupe without it.
    const email = ticket.email ?? dto.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException(
        "We need an email address to finish setting up your account.",
      );
    }
    if (ticket.email && dto.email && ticket.email !== dto.email.trim().toLowerCase()) {
      throw new BadRequestException("Email does not match the one from your sign-in provider");
    }

    const displayName = (dto.displayName ?? ticket.name ?? "").trim() || emailLocalPart(email);

    if (isMinor(dto.birthYear)) {
      if (!dto.parentalConsentToken) {
        throw new BadRequestException(
          "Parental consent is required for learners under 18. Complete /auth/parental-consent/request first.",
        );
      }
      await this.consent.consumeForRegistration(dto.parentalConsentToken, email);
    }

    // The learner may have signed in on a second device while this ticket
    // was open, or finished the same form twice. Either way the identity
    // now exists — hand back a session instead of a 409.
    const alreadyLinked = await this.users.findByProviderIdentity(ticket.provider, ticket.sub);
    if (alreadyLinked) {
      return { status: "authenticated", session: await this.auth.issueSession(alreadyLinked) };
    }

    const existingByEmail = await this.users.findByEmail(email);
    if (existingByEmail) {
      if (!ticket.emailVerified) {
        throw new ConflictException("Email already registered");
      }
      await this.users.linkProviderIdentity(existingByEmail.id, {
        provider: ticket.provider,
        subject: ticket.sub,
        email,
        emailVerified: ticket.emailVerified,
      });
      return { status: "authenticated", session: await this.auth.issueSession(existingByEmail) };
    }

    const user = await this.users.createStudentFromProvider({
      email,
      displayName,
      grade: dto.grade,
      language: dto.language,
      parentalConsentGiven: Boolean(dto.parentalConsentToken),
      identity: {
        provider: ticket.provider,
        subject: ticket.sub,
        email,
        emailVerified: ticket.emailVerified,
      },
    });

    this.logger.log(`Created student ${user.id} via ${ticket.provider} sign-in`);
    return { status: "authenticated", session: await this.auth.issueSession(user) };
  }

  private async verifySignupToken(token: string): Promise<SignupTicket> {
    try {
      const decoded = await this.jwt.verifyAsync<{
        purpose?: string;
        provider?: OAuthProvider;
        sub?: string;
        email?: string;
        emailVerified?: boolean;
        name?: string;
      }>(token, { secret: this.signupSecret });

      if (decoded.purpose !== OauthService.SIGNUP_PURPOSE) {
        throw new UnauthorizedException("Wrong token purpose");
      }
      if (!decoded.provider || !decoded.sub) {
        throw new UnauthorizedException("Signup token is missing its identity");
      }
      return {
        provider: decoded.provider,
        sub: decoded.sub,
        email: decoded.email?.trim().toLowerCase(),
        emailVerified: decoded.emailVerified === true,
        name: decoded.name,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Sign-in expired — please start again");
    }
  }
}

export type OAuthSignInResult =
  | { status: "authenticated"; session: AuthSession }
  | {
      status: "profile_required";
      signupToken: string;
      email?: string;
      displayName?: string;
      expiresAt: string;
    };

interface SignupTicket {
  provider: OAuthProvider;
  sub: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
}

function parseClientIds(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickDisplayName(identity: VerifiedIdentity, fromClient?: string): string | undefined {
  const candidate = identity.name ?? fromClient?.trim();
  return candidate && candidate.length > 0 ? candidate.slice(0, 80) : undefined;
}

function emailLocalPart(email: string): string {
  return email.split("@")[0] || "Learner";
}

/** Mirrors AuthService.register — under-18 ⇒ parental consent required. */
function isMinor(birthYear: number): boolean {
  return new Date().getUTCFullYear() - birthYear < 18;
}
