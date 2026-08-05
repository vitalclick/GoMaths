import { BadRequestException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { generateKeyPairSync, createSign, randomUUID } from "node:crypto";
import { AuthService } from "./auth.service";
import { OauthService } from "./oauth.service";
import { _resetJwksCache } from "./oauth-verifier";
import { ParentalConsentService } from "./parental-consent.service";
import { UsersService } from "./users.service";
import type { MailService } from "../mail/mail.service";
import type { PrismaService } from "../prisma/prisma.service";

/**
 * These tests mint real RS256 ID tokens with a throwaway key pair and
 * serve the matching JWKS through a stubbed fetch, so the verifier is
 * exercised end to end — signature, issuer, audience, expiry, nonce —
 * without touching Google or Apple.
 */

const GOOGLE_CLIENT_ID = "1234.apps.googleusercontent.com";
const APPLE_CLIENT_ID = "com.gomaths.mathai";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const KID = "test-key-1";

const jwk = { ...publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256", use: "sig" };

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

interface TokenClaims {
  iss?: string;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  nonce?: string;
  exp?: number;
  iat?: number;
  kid?: string;
  alg?: string;
}

function mintToken(claims: TokenClaims): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = { alg: claims.alg ?? "RS256", kid: claims.kid ?? KID, typ: "JWT" };
  const payload = {
    iss: claims.iss ?? "https://accounts.google.com",
    aud: claims.aud ?? GOOGLE_CLIENT_ID,
    sub: claims.sub ?? "google-sub-1",
    exp: claims.exp ?? nowSeconds + 600,
    iat: claims.iat ?? nowSeconds,
    ...(claims.email !== undefined ? { email: claims.email } : {}),
    ...(claims.email_verified !== undefined ? { email_verified: claims.email_verified } : {}),
    ...(claims.name !== undefined ? { name: claims.name } : {}),
    ...(claims.nonce !== undefined ? { nonce: claims.nonce } : {}),
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

/** Stub fetch that answers both providers' JWKS endpoints with our test key. */
function stubFetch(): typeof fetch {
  return (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => ({ keys: [jwk] }),
    }) as unknown as Response) as unknown as typeof fetch;
}

function makeService() {
  const prismaStub = { enabled: false } as unknown as PrismaService;
  const users = new UsersService(prismaStub);
  const jwt = new JwtService({ secret: "test-access-secret", signOptions: { expiresIn: "15m" } });
  const config = {
    get: (key: string, fallback: string) => {
      if (key === "GOOGLE_OAUTH_CLIENT_IDS") return GOOGLE_CLIENT_ID;
      if (key === "APPLE_OAUTH_CLIENT_IDS") return APPLE_CLIENT_ID;
      return fallback;
    },
  } as unknown as ConfigService;
  const mailStub = { sendParentalConsentInvite: async () => undefined } as unknown as MailService;
  const consent = new ParentalConsentService(jwt, prismaStub, mailStub, config);
  const auth = new AuthService(users, jwt, prismaStub, consent, config);
  return { oauth: new OauthService(users, auth, jwt, consent, config), users, auth, consent, jwt };
}

const ADULT_BIRTH_YEAR = new Date().getUTCFullYear() - 25;
const MINOR_BIRTH_YEAR = new Date().getUTCFullYear() - 12;

beforeEach(() => {
  _resetJwksCache();
  globalThis.fetch = stubFetch();
});

describe("OauthService", () => {
  describe("first sign-in", () => {
    it("does not create an account until the profile is completed", async () => {
      const { oauth, users } = makeService();
      const result = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "new@example.com", email_verified: true, name: "Thabo M" }),
      });

      expect(result.status).toBe("profile_required");
      if (result.status !== "profile_required") throw new Error("unreachable");
      expect(result.signupToken).toBeTruthy();
      expect(result.email).toBe("new@example.com");
      expect(result.displayName).toBe("Thabo M");
      // Nothing persisted yet — we still need a grade and birth year.
      await expect(users.findByEmail("new@example.com")).resolves.toBeUndefined();
    });

    it("creates the account and issues a session on complete", async () => {
      const { oauth } = makeService();
      const started = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "new@example.com", email_verified: true, name: "Thabo M" }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");

      const done = await oauth.complete({
        signupToken: started.signupToken,
        grade: 9,
        birthYear: ADULT_BIRTH_YEAR,
      });

      expect(done.session.accessToken).toBeTruthy();
      expect(done.session.user.email).toBe("new@example.com");
      expect(done.session.user.displayName).toBe("Thabo M");
      expect(done.session.user.grade).toBe(9);
      expect(done.session.user).not.toHaveProperty("passwordHash");
    });

    it("falls back to the email local part when no name is available", async () => {
      const { oauth } = makeService();
      const started = await oauth.signIn({
        provider: "apple",
        idToken: mintToken({
          iss: "https://appleid.apple.com",
          aud: APPLE_CLIENT_ID,
          sub: "apple-sub-1",
          email: "lerato@example.com",
          email_verified: true,
        }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");

      const done = await oauth.complete({
        signupToken: started.signupToken,
        grade: 8,
        birthYear: ADULT_BIRTH_YEAR,
      });
      expect(done.session.user.displayName).toBe("lerato");
    });
  });

  describe("returning learner", () => {
    it("signs straight in once the identity is linked", async () => {
      const { oauth } = makeService();
      const idToken = mintToken({ email: "back@example.com", email_verified: true });

      const started = await oauth.signIn({ provider: "google", idToken });
      if (started.status !== "profile_required") throw new Error("unreachable");
      await oauth.complete({
        signupToken: started.signupToken,
        grade: 10,
        birthYear: ADULT_BIRTH_YEAR,
      });

      const again = await oauth.signIn({ provider: "google", idToken });
      expect(again.status).toBe("authenticated");
      if (again.status !== "authenticated") throw new Error("unreachable");
      expect(again.session.user.email).toBe("back@example.com");
    });

    it("keeps the same account when the provider email changes", async () => {
      const { oauth } = makeService();
      const started = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ sub: "stable-sub", email: "old@example.com", email_verified: true }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");
      const created = await oauth.complete({
        signupToken: started.signupToken,
        grade: 7,
        birthYear: ADULT_BIRTH_YEAR,
      });

      // Same `sub`, different email: identity lookup wins over email.
      const again = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ sub: "stable-sub", email: "new@example.com", email_verified: true }),
      });
      if (again.status !== "authenticated") throw new Error("unreachable");
      expect(again.session.user.id).toBe(created.session.user.id);
    });
  });

  describe("account linking", () => {
    it("links a verified provider email onto an existing password account", async () => {
      const { oauth, auth } = makeService();
      const registered = await auth.register({
        email: "existing@example.com",
        password: "longenoughpassword",
        displayName: "Existing Learner",
        grade: 11,
        birthYear: ADULT_BIRTH_YEAR,
      });

      const result = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "existing@example.com", email_verified: true }),
      });

      expect(result.status).toBe("authenticated");
      if (result.status !== "authenticated") throw new Error("unreachable");
      expect(result.session.user.id).toBe(registered.user.id);
    });

    it("refuses to link an unverified provider email", async () => {
      const { oauth, auth } = makeService();
      await auth.register({
        email: "existing@example.com",
        password: "longenoughpassword",
        displayName: "Existing Learner",
        grade: 11,
        birthYear: ADULT_BIRTH_YEAR,
      });

      await expect(
        oauth.signIn({
          provider: "google",
          idToken: mintToken({ email: "existing@example.com", email_verified: false }),
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("parental consent", () => {
    it("blocks a minor sign-up with no consent token", async () => {
      const { oauth } = makeService();
      const started = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "kid@example.com", email_verified: true }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");

      await expect(
        oauth.complete({
          signupToken: started.signupToken,
          grade: 6,
          birthYear: MINOR_BIRTH_YEAR,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("lets a minor through once a parent has confirmed", async () => {
      const { oauth, consent } = makeService();
      const started = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "kid@example.com", email_verified: true }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");

      const invite = await consent.request("parent@example.com", "kid@example.com");
      const token = new URL(invite.inviteUrl).searchParams.get("token");
      const { receiptToken } = await consent.confirm(token as string);

      const done = await oauth.complete({
        signupToken: started.signupToken,
        grade: 6,
        birthYear: MINOR_BIRTH_YEAR,
        parentalConsentToken: receiptToken,
      });
      expect(done.session.user.parentalConsentAt).toBeTruthy();
    });
  });

  describe("token validation", () => {
    it("rejects a token issued for a different app", async () => {
      const { oauth } = makeService();
      await expect(
        oauth.signIn({
          provider: "google",
          idToken: mintToken({ aud: "someone-elses-client-id" }),
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a token from an untrusted issuer", async () => {
      const { oauth } = makeService();
      await expect(
        oauth.signIn({ provider: "google", idToken: mintToken({ iss: "https://evil.example" }) }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejects an expired token", async () => {
      const { oauth } = makeService();
      const nowSeconds = Math.floor(Date.now() / 1000);
      await expect(
        oauth.signIn({
          provider: "google",
          idToken: mintToken({ exp: nowSeconds - 3600, iat: nowSeconds - 7200 }),
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a tampered signature", async () => {
      const { oauth } = makeService();
      const token = mintToken({ email: "a@example.com", email_verified: true });
      const [header, payload, signature] = token.split(".");
      const forged = `${header}.${base64url(
        JSON.stringify({
          iss: "https://accounts.google.com",
          aud: GOOGLE_CLIENT_ID,
          sub: "attacker",
          exp: Math.floor(Date.now() / 1000) + 600,
        }),
      )}.${signature}`;

      await expect(oauth.signIn({ provider: "google", idToken: forged })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects an alg:none token", async () => {
      const { oauth } = makeService();
      const header = base64url(JSON.stringify({ alg: "none", kid: KID, typ: "JWT" }));
      const payload = base64url(
        JSON.stringify({
          iss: "https://accounts.google.com",
          aud: GOOGLE_CLIENT_ID,
          sub: "attacker",
          exp: Math.floor(Date.now() / 1000) + 600,
        }),
      );
      await expect(
        oauth.signIn({ provider: "google", idToken: `${header}.${payload}.` }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a nonce mismatch", async () => {
      const { oauth } = makeService();
      await expect(
        oauth.signIn({
          provider: "google",
          idToken: mintToken({ nonce: "one" }),
          nonce: "two",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("accepts a matching nonce", async () => {
      const { oauth } = makeService();
      const nonce = randomUUID();
      const result = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ nonce, email: "nonce@example.com", email_verified: true }),
        nonce,
      });
      expect(result.status).toBe("profile_required");
    });

    it("rejects a Google token presented as an Apple one", async () => {
      const { oauth } = makeService();
      await expect(oauth.signIn({ provider: "apple", idToken: mintToken({}) })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("configuration", () => {
    it("reports only the providers that have client IDs", () => {
      const prismaStub = { enabled: false } as unknown as PrismaService;
      const users = new UsersService(prismaStub);
      const jwt = new JwtService({ secret: "s" });
      const config = {
        get: (key: string, fallback: string) =>
          key === "GOOGLE_OAUTH_CLIENT_IDS" ? GOOGLE_CLIENT_ID : fallback,
      } as unknown as ConfigService;
      const mailStub = {
        sendParentalConsentInvite: async () => undefined,
      } as unknown as MailService;
      const consent = new ParentalConsentService(jwt, prismaStub, mailStub, config);
      const auth = new AuthService(users, jwt, prismaStub, consent, config);
      const oauth = new OauthService(users, auth, jwt, consent, config);

      expect(oauth.enabledProviders()).toEqual(["google"]);
    });

    it("refuses sign-in for an unconfigured provider", async () => {
      // Built without any client IDs, so every provider is off.
      const prismaStub = { enabled: false } as unknown as PrismaService;
      const users = new UsersService(prismaStub);
      const jwt = new JwtService({ secret: "s" });
      const config = {
        get: (_k: string, fallback: string) => fallback,
      } as unknown as ConfigService;
      const mailStub = {
        sendParentalConsentInvite: async () => undefined,
      } as unknown as MailService;
      const consent = new ParentalConsentService(jwt, prismaStub, mailStub, config);
      const auth = new AuthService(users, jwt, prismaStub, consent, config);
      const bare = new OauthService(users, auth, jwt, consent, config);

      await expect(bare.signIn({ provider: "google", idToken: mintToken({}) })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("signup token", () => {
    it("rejects a forged signup token", async () => {
      const { oauth } = makeService();
      await expect(
        oauth.complete({ signupToken: "not-a-real-token", grade: 9, birthYear: ADULT_BIRTH_YEAR }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("is idempotent when the same ticket is submitted twice", async () => {
      const { oauth } = makeService();
      const started = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "twice@example.com", email_verified: true }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");

      const first = await oauth.complete({
        signupToken: started.signupToken,
        grade: 9,
        birthYear: ADULT_BIRTH_YEAR,
      });
      const second = await oauth.complete({
        signupToken: started.signupToken,
        grade: 9,
        birthYear: ADULT_BIRTH_YEAR,
      });
      expect(second.session.user.id).toBe(first.session.user.id);
    });

    it("rejects an email that contradicts the provider's", async () => {
      const { oauth } = makeService();
      const started = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "real@example.com", email_verified: true }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");

      await expect(
        oauth.complete({
          signupToken: started.signupToken,
          grade: 9,
          birthYear: ADULT_BIRTH_YEAR,
          email: "attacker@example.com",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("password login for social accounts", () => {
    it("cannot be logged into with a password", async () => {
      const { oauth, auth } = makeService();
      const started = await oauth.signIn({
        provider: "google",
        idToken: mintToken({ email: "social@example.com", email_verified: true }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");
      await oauth.complete({
        signupToken: started.signupToken,
        grade: 9,
        birthYear: ADULT_BIRTH_YEAR,
      });

      await expect(auth.login({ email: "social@example.com", password: "" })).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        auth.login({ email: "social@example.com", password: "anything" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("duplicate email", () => {
    it("rejects an unverified provider email that collides at complete time", async () => {
      const { oauth, auth } = makeService();
      const started = await oauth.signIn({
        provider: "apple",
        idToken: mintToken({
          iss: "https://appleid.apple.com",
          aud: APPLE_CLIENT_ID,
          sub: "apple-unverified",
          email: "clash@example.com",
          email_verified: false,
        }),
      });
      if (started.status !== "profile_required") throw new Error("unreachable");

      // Someone registers that email while the ticket is open.
      await auth.register({
        email: "clash@example.com",
        password: "longenoughpassword",
        displayName: "First",
        grade: 9,
        birthYear: ADULT_BIRTH_YEAR,
      });

      await expect(
        oauth.complete({
          signupToken: started.signupToken,
          grade: 9,
          birthYear: ADULT_BIRTH_YEAR,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
