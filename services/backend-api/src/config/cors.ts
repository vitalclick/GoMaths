import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

/**
 * CORS policy resolution.
 *
 * Native iOS/Android clients do not perform preflight checks, so the API
 * ran without CORS for as long as the only consumers were Expo native
 * builds. The Student web SPA (Cloudflare Pages) is a browser client on a
 * different origin to `api.gomaths.co.za`, so every call it makes is
 * cross-origin and is blocked unless the API opts that origin in.
 *
 * Policy:
 *  - `CORS_ORIGINS` set   → allow exactly those origins, everywhere.
 *  - unset, non-production → reflect any origin, so a laptop hitting the
 *    API from `http://localhost:8081` (Expo web) just works.
 *  - unset, production     → send no CORS headers at all. Browsers are
 *    blocked; native clients are unaffected. `assertConfig` warns loudly
 *    about this at boot rather than silently guessing an allowlist.
 *
 * Auth is Bearer-token only (tokens live in expo-secure-store, not
 * cookies), so `credentials` stays off — that keeps a bare `*` allowlist
 * from becoming a session-riding hazard.
 */

/** Split a comma-separated `CORS_ORIGINS` value into trimmed entries. */
export function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Turn one allowlist entry into something Nest can match against.
 *
 * A `*` in the entry matches a single hostname label, so
 * `https://*.gomaths-student.pages.dev` covers Cloudflare Pages preview
 * deployments (`https://a1b2c3d4.gomaths-student.pages.dev`) without also
 * matching an unrelated `https://evil.pages.dev`.
 */
export function toOriginMatcher(pattern: string): string | RegExp {
  if (!pattern.includes("*")) return pattern;

  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, "[^./]+");
  return new RegExp(`^${escaped}$`, "i");
}

const BASE_OPTIONS: CorsOptions = {
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // Bearer tokens travel in the Authorization header; no cookies are set.
  credentials: false,
  // Cache preflights for a day — the app makes many cross-origin calls
  // and the allowlist changes about once a quarter.
  maxAge: 86400,
};

/**
 * Build the options for `app.enableCors()`, or `false` when CORS should
 * not be enabled at all.
 */
export function resolveCorsOptions(env: Record<string, string | undefined>): CorsOptions | false {
  const origins = parseCorsOrigins(env.CORS_ORIGINS);
  const isProd = (env.NODE_ENV ?? "development") === "production";

  if (origins.length === 0) {
    return isProd ? false : { ...BASE_OPTIONS, origin: true };
  }

  // A bare `*` means "any origin". Pass the literal through rather than a
  // matcher so the browser gets `Access-Control-Allow-Origin: *`.
  if (origins.includes("*")) {
    return { ...BASE_OPTIONS, origin: "*" };
  }

  return { ...BASE_OPTIONS, origin: origins.map(toOriginMatcher) };
}
