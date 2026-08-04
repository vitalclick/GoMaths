/**
 * Public GoMaths web pages.
 *
 * These live outside the app (served by Caddy from `web/` — see
 * infrastructure/vps/caddy/Caddyfile) because they must be reachable
 * without installing anything: Google's OAuth consent screen, the App
 * Store and Play all require public URLs, and a parent asked to consent
 * needs to read the notice before they have an account.
 */

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://gomaths.co.za";

export const PRIVACY_URL = `${SITE_URL}/privacy.html`;
export const TERMS_URL = `${SITE_URL}/terms.html`;
