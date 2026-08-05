import { UnauthorizedException } from "@nestjs/common";
import { createPublicKey, timingSafeEqual, verify as cryptoVerify } from "node:crypto";

/**
 * OpenID Connect ID-token verification for Google and Apple.
 *
 * Deliberately dependency-free: the whole job is "fetch the provider's
 * JWKS, check an RS256 signature, check the standard claims", and Node 22
 * can import a JWK directly via `createPublicKey({ format: "jwk" })`. That
 * beats pulling `jose`/`jwks-rsa` in for ~120 lines.
 *
 * What we validate, and why each one matters:
 *   - alg is RS256           — refuses `alg: none` and HS256 confusion, where
 *                              an attacker signs with the public key as HMAC key.
 *   - signature over the JWKS key matching `kid`.
 *   - iss is the provider's  — stops a token minted by some other IdP.
 *   - aud is one of OUR      — stops the "token substitution" attack: a token
 *     client IDs                Google issued for a different app is valid, just
 *                              not valid *here*.
 *   - exp / iat within skew.
 *   - nonce matches the one   — binds the token to the sign-in attempt the
 *     the client generated       client actually started (replay protection).
 *
 * The email in the token is only trusted for account-linking when the
 * provider says it is verified — see OauthService.
 */

export type OAuthProvider = "google" | "apple";

export interface VerifiedIdentity {
  provider: OAuthProvider;
  /** The provider's immutable `sub` claim. */
  subject: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
}

interface ProviderConfig {
  issuers: string[];
  jwksUri: string;
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  // Google has historically issued both forms of the issuer claim.
  google: {
    issuers: ["https://accounts.google.com", "accounts.google.com"],
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  },
  apple: {
    issuers: ["https://appleid.apple.com"],
    jwksUri: "https://appleid.apple.com/auth/keys",
  },
};

/** Tolerance for clock drift between us and the provider. */
const CLOCK_SKEW_SECONDS = 120;

/** How long a fetched JWKS is reused before we go back to the provider. */
const JWKS_TTL_MS = 60 * 60 * 1000;

/**
 * Floor between JWKS refetches triggered by an unknown `kid`. Without it,
 * a flood of tokens carrying junk kids turns into a flood of outbound
 * requests to Google/Apple.
 */
const JWKS_MIN_REFETCH_MS = 5 * 60 * 1000;

interface JsonWebKey {
  kid?: string;
  kty?: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
}

interface JwksCacheEntry {
  keys: JsonWebKey[];
  fetchedAt: number;
  lastRefetchAt: number;
}

export interface VerifyOptions {
  /** Client IDs we accept in `aud`. Empty means the provider is not configured. */
  audiences: string[];
  /**
   * Expected `nonce`. Optional here only because this stays a general OIDC
   * helper — but a caller that omits it gets no replay protection at all.
   * For sign-in that is non-negotiable, so `OAuthSignInDto` makes the field
   * required at the HTTP boundary rather than trusting each call site.
   */
  nonce?: string;
  /** Seam for tests — defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Seam for tests — defaults to Date.now. */
  now?: () => number;
}

const jwksCache = new Map<string, JwksCacheEntry>();

/** Test helper — drops every cached JWKS. */
export function _resetJwksCache(): void {
  jwksCache.clear();
}

export async function verifyIdToken(
  provider: OAuthProvider,
  idToken: string,
  options: VerifyOptions,
): Promise<VerifiedIdentity> {
  const config = PROVIDERS[provider];
  if (!config) throw new UnauthorizedException("Unsupported sign-in provider");
  if (options.audiences.length === 0) {
    throw new UnauthorizedException(`${provider} sign-in is not configured on this server`);
  }

  const now = options.now ?? Date.now;
  const { header, payload, signingInput, signature } = decode(idToken);

  if (header.alg !== "RS256") {
    throw new UnauthorizedException("Unsupported ID token algorithm");
  }
  if (!header.kid) {
    throw new UnauthorizedException("ID token has no key id");
  }

  const jwk = await resolveKey(config.jwksUri, header.kid, options, now);
  let publicKey;
  try {
    publicKey = createPublicKey({ key: jwk as never, format: "jwk" });
  } catch {
    throw new UnauthorizedException("Provider signing key could not be read");
  }

  const signatureOk = cryptoVerify("RSA-SHA256", Buffer.from(signingInput), publicKey, signature);
  if (!signatureOk) throw new UnauthorizedException("ID token signature is invalid");

  // --- claims -------------------------------------------------------------

  if (typeof payload.iss !== "string" || !config.issuers.includes(payload.iss)) {
    throw new UnauthorizedException("ID token issuer is not trusted");
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const audienceOk = audiences.some(
    (aud) =>
      typeof aud === "string" && options.audiences.some((ours) => constantTimeEquals(aud, ours)),
  );
  if (!audienceOk) throw new UnauthorizedException("ID token was not issued for this app");

  const nowSeconds = Math.floor(now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp + CLOCK_SKEW_SECONDS < nowSeconds) {
    throw new UnauthorizedException("ID token has expired");
  }
  if (typeof payload.iat === "number" && payload.iat - CLOCK_SKEW_SECONDS > nowSeconds) {
    throw new UnauthorizedException("ID token was issued in the future");
  }

  if (options.nonce !== undefined) {
    if (typeof payload.nonce !== "string" || !constantTimeEquals(payload.nonce, options.nonce)) {
      throw new UnauthorizedException("ID token nonce does not match");
    }
  }

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new UnauthorizedException("ID token has no subject");
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : undefined;

  return {
    provider,
    subject: payload.sub,
    email: email || undefined,
    // Both providers have shipped this claim as a bare boolean and as the
    // strings "true"/"false" at different points. Anything else is false.
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : undefined,
  };
}

// ---------------------------------------------------------------------------

interface JwtHeader {
  alg?: string;
  kid?: string;
}

interface JwtPayload {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  exp?: unknown;
  iat?: unknown;
  nonce?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
}

function decode(idToken: string): {
  header: JwtHeader;
  payload: JwtPayload;
  signingInput: string;
  signature: Buffer;
} {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new UnauthorizedException("Malformed ID token");
  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    return {
      header: JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8")) as JwtHeader,
      payload: JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as JwtPayload,
      signingInput: `${headerB64}.${payloadB64}`,
      signature: Buffer.from(signatureB64, "base64url"),
    };
  } catch {
    throw new UnauthorizedException("Malformed ID token");
  }
}

/**
 * Returns the JWK matching `kid`, refetching the JWKS once if the key is
 * unknown (providers rotate keys without warning). The refetch is rate
 * limited so unknown-kid spam can't be turned into an outbound flood.
 */
async function resolveKey(
  jwksUri: string,
  kid: string,
  options: VerifyOptions,
  now: () => number,
): Promise<JsonWebKey> {
  let entry = jwksCache.get(jwksUri);

  if (!entry || now() - entry.fetchedAt > JWKS_TTL_MS) {
    entry = await fetchJwks(jwksUri, options, now);
  }

  let key = entry.keys.find((k) => k.kid === kid);
  if (!key && now() - entry.lastRefetchAt > JWKS_MIN_REFETCH_MS) {
    entry = await fetchJwks(jwksUri, options, now);
    key = entry.keys.find((k) => k.kid === kid);
  }

  if (!key) throw new UnauthorizedException("ID token was signed with an unknown key");
  if (key.kty !== "RSA" || !key.n || !key.e) {
    throw new UnauthorizedException("Provider signing key is not an RSA key");
  }
  return key;
}

async function fetchJwks(
  jwksUri: string,
  options: VerifyOptions,
  now: () => number,
): Promise<JwksCacheEntry> {
  const doFetch = options.fetchImpl ?? fetch;
  let keys: JsonWebKey[];
  try {
    const res = await doFetch(jwksUri, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { keys?: JsonWebKey[] };
    keys = Array.isArray(body.keys) ? body.keys : [];
  } catch {
    // Serve a stale cache rather than locking every learner out because
    // the provider blipped. A stale JWKS still only validates real keys.
    const stale = jwksCache.get(jwksUri);
    if (stale) return stale;
    throw new UnauthorizedException("Could not reach the sign-in provider");
  }

  const entry: JwksCacheEntry = { keys, fetchedAt: now(), lastRefetchAt: now() };
  jwksCache.set(jwksUri, entry);
  return entry;
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
