/**
 * Public GoMaths web pages.
 *
 * These live outside the app — in `UI/landing_page`, prerendered to static
 * HTML and hosted on cPanel — because they must be reachable without
 * installing anything: Google's OAuth consent screen, the App Store and
 * Play all require public URLs, and a parent asked to consent needs to
 * read the notice before they have an account.
 *
 * Extensionless paths: the landing page emits `privacy/index.html`, so
 * `/privacy` resolves on Apache without the `.html`.
 */

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://gomaths.co.za";

export const PRIVACY_URL = `${SITE_URL}/privacy`;
export const TERMS_URL = `${SITE_URL}/terms`;
