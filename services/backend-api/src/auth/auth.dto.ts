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

  @IsOptional()
  @IsIn(["en", "af", "zu", "st", "xh"])
  language?: "en" | "af" | "zu" | "st" | "xh";

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
