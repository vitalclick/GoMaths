import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type { OAuthProvider } from "./oauth-verifier";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  /**
   * Year of birth (gregorian). Server uses this to decide whether
   * parentalConsentToken is required — never the client's word for it.
   * Bound: 1990..currentYear so a forged 1900 doesn't pass.
   */
  @IsInt()
  @Min(1990)
  @Max(2100)
  birthYear!: number;

  @IsOptional()
  @IsIn(["en", "af", "zu", "st", "xh"])
  language?: "en" | "af" | "zu" | "st" | "xh";

  /**
   * Receipt token returned by /auth/parental-consent/confirm. Required
   * server-side when the learner is < 18 by birthYear; rejected when
   * absent for minors and rejected when the email it was issued for
   * doesn't match `email`.
   */
  @IsOptional()
  @IsString()
  parentalConsentToken?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class OAuthSignInDto {
  @IsIn(["google", "apple"])
  provider!: OAuthProvider;

  /** The OIDC ID token the native provider SDK returned to the app. */
  @IsString()
  @MinLength(1)
  idToken!: string;

  /**
   * The nonce the client generated for this sign-in attempt. When present
   * it must match the `nonce` claim in the ID token, which binds the token
   * to this attempt and blocks replay of a token captured elsewhere.
   */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  nonce?: string;

  /**
   * Apple returns the learner's name to the *client* on the first
   * authorisation only, and never in the ID token — so the app forwards
   * it here. Treated as a suggestion: it only ever becomes a display name
   * on a brand-new account.
   */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;
}

export class OAuthCompleteDto {
  /** Short-lived ticket from POST /auth/oauth (status: profile_required). */
  @IsString()
  signupToken!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  grade!: number;

  /** Same server-side minor check as /auth/register. */
  @IsInt()
  @Min(1990)
  @Max(2100)
  birthYear!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  /**
   * Only used when the provider withheld the email (an Apple user can
   * decline to share one). Rejected when it disagrees with an email the
   * provider did assert.
   */
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(["en", "af", "zu", "st", "xh"])
  language?: "en" | "af" | "zu" | "st" | "xh";

  @IsOptional()
  @IsString()
  parentalConsentToken?: string;
}

export class ParentalConsentRequestDto {
  @IsEmail()
  parentEmail!: string;

  @IsEmail()
  studentEmail!: string;
}

export class ParentalConsentConfirmDto {
  @IsString()
  token!: string;
}

export class ParentalConsentPollDto {
  @IsString()
  id!: string;

  @IsEmail()
  studentEmail!: string;
}
