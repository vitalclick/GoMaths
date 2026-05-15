/**
 * Sentry MUST be initialised before any other application module —
 * its OpenTelemetry-style instrumentation patches Node's HTTP / Postgres
 * clients on first import, so anything imported earlier wouldn't be
 * traced. Hence the dedicated `instrument.ts` that `main.ts` imports at
 * the very top.
 *
 * No DSN configured ⇒ Sentry stays silent (init() is a no-op without
 * the env var). That means local dev and the demo path don't need any
 * setup; only production/staging do.
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE,
    integrations: [nodeProfilingIntegration()],
    // Phase 1 dial-down: start at 100% so we see the first month of
    // pilot traffic; the operator can ratchet down once we have a
    // baseline.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "1"),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? "1"),
    // Strip sensitive request data — no Authorization headers, no
    // cookies. Email + password fields in /api/auth/* are also
    // already in the path so we don't need to redact bodies further
    // here; Phase 1 should add a beforeSend hook that scrubs anything
    // that looks like a PII field.
    sendDefaultPii: false,
  });
}

export { Sentry };
