import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  ParentalConsentConfirmDto,
  ParentalConsentPollDto,
  ParentalConsentRequestDto,
  RefreshDto,
  RegisterDto,
} from "./auth.dto";
import { CurrentUser, JwtAuthGuard, Public, type JwtClaims } from "./auth.guard";
import { ParentalConsentService } from "./parental-consent.service";
import { UsersService } from "./users.service";

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly consent: ParentalConsentService,
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
