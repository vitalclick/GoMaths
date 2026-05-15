/**
 * Sentry init for the Expo build (iOS / Android / Web via Metro).
 *
 * Hooked from `app/_layout.tsx` so capture starts before the first
 * screen mounts. DSN comes from `EXPO_PUBLIC_SENTRY_DSN`; when it's
 * unset (the default in this repo for dev) Sentry stays silent.
 *
 * Phase 1 hardening:
 *  - Set the authenticated user on Sentry once auth resolves (scope
 *    onto `Sentry.setUser({ id })`) so we can correlate crashes with
 *    the JWT sub. Be careful with PII — do NOT send email or name.
 *  - Set `dist` + `release` from the EAS update id so we can tell
 *    which OTA shipped a regression.
 */

import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialised = false;

export function initSentry(): void {
  if (initialised || !dsn) return;
  initialised = true;
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? "development",
    // Phase 1: lower this once we have a baseline.
    tracesSampleRate: 1,
    // Don't send IP / user-agent until the parental-consent flow
    // explicitly opts in.
    sendDefaultPii: false,
  });
}

export { Sentry };
