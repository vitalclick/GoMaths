import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

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
