import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterPushTokenDto {
  /**
   * Expo push token. Expo tokens look like `ExponentPushToken[...]` or
   * `ExpoPushToken[...]`. We validate the prefix only — the inner
   * payload is opaque.
   */
  @IsString()
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9\-_]+\]$/, {
    message: "token must be a valid Expo push token",
  })
  token!: string;

  @IsString()
  @IsIn(["ios", "android", "web"])
  platform!: "ios" | "android" | "web";

  /** The app the token came from — `student`, `parent`, `teacher`. */
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  appSlug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceName?: string;
}
