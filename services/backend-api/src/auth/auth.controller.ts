import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  OAuthCompleteDto,
  OAuthSignInDto,
  ParentalConsentConfirmDto,
  ParentalConsentPollDto,
  ParentalConsentRequestDto,
  RefreshDto,
  RegisterDto,
} from "./auth.dto";
import { CurrentUser, JwtAuthGuard, Public, type JwtClaims } from "./auth.guard";
import { OauthService } from "./oauth.service";
import { renderConsentPage } from "./parental-consent-page";
import { ParentalConsentService } from "./parental-consent.service";
import { UsersService } from "./users.service";

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly consent: ParentalConsentService,
    private readonly oauth: OauthService,
  ) {}

  @Public()
  @Post("auth/register")
  @HttpCode(201)
  @ApiOperation({ summary: "Register a new student account" })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("auth/login")
  @HttpCode(200)
  @ApiOperation({ summary: "Exchange credentials for tokens" })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Get("auth/providers")
  @ApiOperation({
    summary: "Which social providers this deployment supports",
    description:
      "The app hides a provider button when its client ID is not configured, so a misconfigured environment degrades to email sign-in instead of showing a button that always fails.",
  })
  providers() {
    return { providers: this.oauth.enabledProviders() };
  }

  @Public()
  @Post("auth/oauth")
  @HttpCode(200)
  @ApiOperation({
    summary: "Sign in with Google or Apple",
    description:
      "Verifies the provider ID token. Returns a session for a known identity (or a verified email that already has an account); otherwise returns a short-lived signupToken to submit to /auth/oauth/complete with the grade and birth year we still need.",
  })
  oauthSignIn(@Body() dto: OAuthSignInDto) {
    return this.oauth.signIn(dto);
  }

  @Public()
  @Post("auth/oauth/complete")
  @HttpCode(201)
  @ApiOperation({
    summary: "Finish a social sign-up",
    description:
      "Creates the account behind a signupToken once the learner has supplied grade + birth year, applying the same under-18 parental-consent rule as /auth/register.",
  })
  oauthComplete(@Body() dto: OAuthCompleteDto) {
    return this.oauth.complete(dto);
  }

  @Public()
  @Post("auth/refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Refresh an access token" })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post("auth/parental-consent/request")
  @HttpCode(202)
  @ApiOperation({
    summary: "Mail a parental-consent invite",
    description:
      "Issues a signed JWT mailed to the parent. The parent clicks the link and the student app calls /auth/parental-consent/confirm with that JWT.",
  })
  requestConsent(@Body() dto: ParentalConsentRequestDto) {
    return this.consent.request(dto.parentEmail, dto.studentEmail);
  }

  @Public()
  @Post("auth/parental-consent/confirm")
  @HttpCode(200)
  @ApiOperation({
    summary: "Confirm parental consent",
    description:
      "Verifies the invite JWT, marks the consent record CONFIRMED, returns a short-lived receipt token that the registration form submits as parentalConsentToken.",
  })
  confirmConsent(@Body() dto: ParentalConsentConfirmDto, @Req() req: Request) {
    return this.consent.confirm(dto.token, {
      ip: extractIp(req),
      userAgent: req.headers["user-agent"],
    });
  }

  @Public()
  @Get("auth/parental-consent/confirm")
  @ApiOperation({
    summary: "Parent-facing consent confirmation landing page",
    description:
      "The link mailed to the parent is a plain GET click from an email client. There's no " +
      "separate public web app deployed yet to host that landing page, so this renders it " +
      "directly and confirms the invite JWT server-side, the same way the POST endpoint does.",
  })
  async confirmConsentPage(
    @Query("token") token: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!token) {
      res
        .status(400)
        .type("html")
        .send(
          renderConsentPage({
            ok: false,
            heading: "Missing confirmation link",
            message:
              "This link is missing its confirmation token. Please open the link from the email exactly as sent.",
          }),
        );
      return;
    }

    try {
      const result = await this.consent.confirm(token, {
        ip: extractIp(req),
        userAgent: req.headers["user-agent"],
      });
      res
        .status(200)
        .type("html")
        .send(
          renderConsentPage({
            ok: true,
            heading: "Thanks — you're all set",
            message: `You've confirmed GoMaths for ${result.studentEmail}. They can now finish creating their account in the app.`,
          }),
        );
    } catch (err) {
      const status = err instanceof HttpException ? err.getStatus() : 500;
      const message = consentErrorMessage(err);
      res
        .status(status)
        .type("html")
        .send(
          renderConsentPage({
            ok: false,
            heading: "We couldn't confirm this link",
            message,
          }),
        );
    }
  }

  @Public()
  @Post("auth/parental-consent/poll")
  @HttpCode(200)
  @ApiOperation({
    summary: "Poll consent status (student app)",
    description:
      "Returns the current state of a consent record. When the row first reaches CONFIRMED a one-time receiptToken is returned in the response; subsequent polls return CONFIRMED without it.",
  })
  pollConsent(@Body() dto: ParentalConsentPollDto) {
    return this.consent.poll(dto.id, dto.studentEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Get("users/me")
  @ApiOperation({ summary: "Current user" })
  async me(@CurrentUser() claims: JwtClaims) {
    const user = await this.users.getById(claims.sub);
    if (!user) throw new Error("User not found"); // should never happen if token is valid
    return user;
  }
}

function extractIp(req: Request): string | undefined {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.ip;
}

/** Nest's exception `message` can be a string or a validation-error array; the page only shows text. */
function consentErrorMessage(err: unknown): string {
  if (err instanceof HttpException) {
    const body = err.getResponse();
    const message = typeof body === "string" ? body : (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "This confirmation link is invalid or has expired.";
}
