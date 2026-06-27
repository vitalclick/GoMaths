import { Logger } from "@nestjs/common";

/**
 * Boot-time configuration validation.
 *
 * The backend is built to run with graceful fallbacks (in-memory stores,
 * log-only mail, per-pod throttling) so it boots on a laptop with zero
 * config. That is great for development and a liability in production: a
 * misconfigured deploy would silently serve from an in-memory store that
 * vanishes on restart, or sign tokens with the public `change-me` dev
 * secret.
 *
 * This module turns those silent fallbacks into loud, explicit signals:
 *  - In every environment it prints a one-glance summary of which real
 *    services are active vs. which fallbacks are in play.
 *  - In production (`NODE_ENV=production`) it HARD-FAILS the boot when a
 *    security- or data-critical setting is missing or still a dev default.
 */

export interface CheckResult {
  /** Fatal in production — boot must abort. */
  fatal: string[];
  /** Non-fatal but operationally important. */
  warnings: string[];
  /** Human-readable active-vs-fallback summary, one line per subsystem. */
  summary: string[];
}

type Env = Record<string, string | undefined>;

const DEV_SECRET_MARKER = "change-me";
const MIN_SECRET_LENGTH = 32;

function isMissing(v: string | undefined): boolean {
  return v === undefined || v.trim() === "";
}

/** A secret is unsafe if missing, a known dev default, or too short. */
function isWeakSecret(v: string | undefined): boolean {
  return isMissing(v) || v!.includes(DEV_SECRET_MARKER) || v!.length < MIN_SECRET_LENGTH;
}

/**
 * Inspect an environment and classify every launch-critical setting.
 * Pure (no process.exit, no logging) so it is unit-testable and reusable
 * by the standalone preflight script.
 */
export function inspectConfig(env: Env = process.env): CheckResult {
  const fatal: string[] = [];
  const warnings: string[] = [];
  const summary: string[] = [];

  // ── Auth secrets ──────────────────────────────────────────────────
  if (isWeakSecret(env.JWT_ACCESS_SECRET)) {
    fatal.push(
      "JWT_ACCESS_SECRET is missing, a dev default, or shorter than " +
        `${MIN_SECRET_LENGTH} chars. Generate one: openssl rand -base64 64`,
    );
  }
  if (isWeakSecret(env.JWT_REFRESH_SECRET)) {
    fatal.push(
      "JWT_REFRESH_SECRET is missing, a dev default, or shorter than " +
        `${MIN_SECRET_LENGTH} chars. Generate one: openssl rand -base64 64`,
    );
  }
  // The consent secrets inherit JWT_ACCESS_SECRET when unset (see
  // parental-consent.service.ts). That is acceptable but not ideal — flag
  // it as a warning, and treat an explicitly-set-but-weak value as fatal.
  for (const key of [
    "PARENTAL_CONSENT_INVITE_SECRET",
    "PARENTAL_CONSENT_RECEIPT_SECRET",
  ] as const) {
    if (isMissing(env[key])) {
      warnings.push(`${key} not set — falling back to JWT_ACCESS_SECRET. Set a distinct secret.`);
    } else if (isWeakSecret(env[key])) {
      fatal.push(`${key} is set but weak (dev default or < ${MIN_SECRET_LENGTH} chars).`);
    }
  }

  // ── Datastores ────────────────────────────────────────────────────
  if (isMissing(env.DATABASE_URL)) {
    fatal.push(
      "DATABASE_URL not set — the backend would use in-memory stores that " +
        "lose all data on restart. Required in production.",
    );
    summary.push("Database     : IN-MEMORY (ephemeral)");
  } else {
    summary.push("Database     : Postgres (Prisma)");
  }

  if (isMissing(env.REDIS_URL)) {
    fatal.push(
      "REDIS_URL not set — rate limiting falls back to per-pod counters and " +
        "the scheduler runs on every pod (duplicate cron). Required for any " +
        "multi-instance deploy.",
    );
    summary.push("Redis        : NONE (per-pod throttling, scheduler on every pod)");
  } else {
    summary.push("Redis        : configured (shared throttling + leader election)");
  }

  // ── Outbound email (parental consent is legally required for minors) ─
  if (isMissing(env.RESEND_API_KEY)) {
    warnings.push(
      "RESEND_API_KEY not set — parental-consent and notification emails are " +
        "LOG-ONLY and will NOT be delivered. Minors cannot complete consent.",
    );
    summary.push("Mail         : LOG-ONLY (no delivery)");
  } else {
    if (isMissing(env.EMAIL_FROM)) {
      warnings.push("RESEND_API_KEY set but EMAIL_FROM is empty — set a verified sender.");
    }
    summary.push("Mail         : Resend");
  }
  if (isMissing(env.PUBLIC_APP_URL)) {
    warnings.push("PUBLIC_APP_URL not set — consent email links may 404.");
  }

  // ── AI service URLs (default to localhost, wrong in production) ──────
  for (const key of [
    "TUTOR_SERVICE_URL",
    "SOLVER_SERVICE_URL",
    "VALIDATION_SERVICE_URL",
  ] as const) {
    const v = env[key];
    if (isMissing(v)) {
      warnings.push(
        `${key} not set — defaulting to localhost, which will not resolve in production.`,
      );
    } else if (/localhost|127\.0\.0\.1/.test(v!)) {
      warnings.push(`${key}=${v} points at localhost — likely wrong for a deployed environment.`);
    }
  }

  // ── Observability ───────────────────────────────────────────────────
  summary.push(`Sentry       : ${isMissing(env.SENTRY_DSN) ? "OFF (no DSN)" : "on"}`);

  return { fatal, warnings, summary };
}

/**
 * Validate config at boot. Logs the summary + warnings always; in
 * production, throws (aborting boot) when any fatal problem is present.
 */
export function assertConfig(env: Env = process.env, logger: Logger = new Logger("Config")): void {
  const isProd = (env.NODE_ENV ?? "development") === "production";
  const { fatal, warnings, summary } = inspectConfig(env);

  logger.log(`Runtime configuration (NODE_ENV=${env.NODE_ENV ?? "development"}):`);
  for (const line of summary) logger.log(`  ${line}`);
  for (const w of warnings) logger.warn(w);

  if (fatal.length === 0) return;

  if (isProd) {
    for (const f of fatal) logger.error(f);
    throw new Error(
      `Refusing to start in production: ${fatal.length} fatal configuration ` +
        `problem(s) above. Fix them or run with NODE_ENV!=production for a ` +
        `degraded local stack.`,
    );
  }

  // Non-production: surface what WOULD block production, but allow boot.
  for (const f of fatal) {
    logger.warn(`[would be fatal in production] ${f}`);
  }
}
