/**
 * Native Google / Apple sign-in for the Student app.
 *
 * Both providers hand us an OpenID Connect ID token; the backend verifies
 * it against the provider's JWKS (see `oauth-verifier.ts`) and turns it
 * into a GoMaths session. Nothing secret lives on the device — there is no
 * client secret in this flow, only a public client ID.
 *
 * Replay protection: we generate a random value per attempt and send its
 * SHA-256 digest to the provider. Both providers echo that digest back
 * verbatim as the token's `nonce` claim, so the same digest — not the raw
 * value — is what the backend compares against.
 *
 * Availability differs by platform, and the UI reflects that rather than
 * showing a button that can only fail:
 *   - Google: iOS, Android and web.
 *   - Apple:  iOS only via the native sheet. Apple's web flow needs a
 *             separate Services ID and a server-side redirect handler,
 *             which this app doesn't ship — matching Apple's own guidance
 *             to surface the button only where it works.
 */

import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

export type SocialProvider = "google" | "apple";

export interface SocialCredential {
  provider: SocialProvider;
  idToken: string;
  /** The digest sent to the provider; the backend matches it to the claim. */
  nonce: string;
  /** Apple only, first authorisation only — the ID token never carries it. */
  displayName?: string;
}

/** Thrown when the learner backs out of the provider sheet. Not an error to show. */
export class SocialAuthCancelled extends Error {
  constructor() {
    super("Sign-in cancelled");
    this.name = "SocialAuthCancelled";
  }
}

// Required so the auth popup closes cleanly on web / Android custom tabs.
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

/**
 * Google issues a different client ID per platform, and the ID token's
 * `aud` is whichever one started the flow — so the backend's
 * GOOGLE_OAUTH_CLIENT_IDS must list all of these.
 */
function googleClientId(): string | undefined {
  const id =
    Platform.select({
      ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    }) ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  return id && id.length > 0 ? id : undefined;
}

export function isGoogleConfigured(): boolean {
  return googleClientId() !== undefined;
}

/** Apple's native sheet exists on iOS 13+ only. */
export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithGoogle(): Promise<SocialCredential> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("Google sign-in isn't set up in this build.");
  }

  const nonce = randomNonce();
  const hashedNonce = await sha256Hex(nonce);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "gomaths-v2" });
  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    // `id_token` keeps the whole exchange on-device: Google returns the
    // signed identity assertion directly, so there's no code to swap for
    // tokens and therefore no client secret to ship.
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: { nonce: hashedNonce },
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);

  if (result.type === "cancel" || result.type === "dismiss") throw new SocialAuthCancelled();
  if (result.type !== "success") {
    throw new Error(result.type === "error" ? describeAuthError(result) : "Google sign-in failed.");
  }

  const idToken = result.params.id_token;
  if (!idToken) throw new Error("Google didn't return an identity token.");

  return { provider: "google", idToken, nonce: hashedNonce };
}

export async function signInWithApple(): Promise<SocialCredential> {
  const nonce = randomNonce();
  const hashedNonce = await sha256Hex(nonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "ERR_REQUEST_CANCELED") {
      throw new SocialAuthCancelled();
    }
    throw new Error("Apple sign-in failed.");
  }

  if (!credential.identityToken) throw new Error("Apple didn't return an identity token.");

  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    provider: "apple",
    idToken: credential.identityToken,
    nonce: hashedNonce,
    displayName: fullName || undefined,
  };
}

export function signInWithProvider(provider: SocialProvider): Promise<SocialCredential> {
  return provider === "google" ? signInWithGoogle() : signInWithApple();
}

function randomNonce(): string {
  return Array.from(Crypto.getRandomBytes(16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

function describeAuthError(result: { error?: { message?: string } | null }): string {
  return result.error?.message ?? "Google sign-in failed.";
}
