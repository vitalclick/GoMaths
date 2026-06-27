#!/usr/bin/env node
/**
 * Pre-deploy environment preflight.
 *
 * Validates that the launch-critical backend environment variables are
 * present and not dev defaults — WITHOUT booting the app. Intended to gate
 * a deploy in CI/CD so a misconfigured release fails fast and loudly.
 *
 * The backend itself runs the authoritative check at boot via
 * `assertConfig()` (services/backend-api/src/config/config.validation.ts);
 * this script mirrors those rules so the failure surfaces before the
 * container even starts.
 *
 * Usage:
 *   node scripts/preflight-env.mjs                 # reads process.env
 *   node scripts/preflight-env.mjs path/to/.env    # reads a dotenv file
 *
 * Exit codes: 0 = ok (warnings allowed), 1 = fatal problem(s).
 */

import { readFileSync } from "node:fs";

const MIN_SECRET_LENGTH = 32;
const DEV_SECRET_MARKER = "change-me";

function loadEnv() {
  const file = process.argv[2];
  if (!file) return process.env;
  const env = { ...process.env };
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const missing = (v) => v === undefined || String(v).trim() === "";
const weakSecret = (v) =>
  missing(v) || String(v).includes(DEV_SECRET_MARKER) || String(v).length < MIN_SECRET_LENGTH;

const env = loadEnv();
const fatal = [];
const warnings = [];

for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
  if (weakSecret(env[key]))
    fatal.push(`${key} missing, a dev default, or < ${MIN_SECRET_LENGTH} chars`);
}
for (const key of ["PARENTAL_CONSENT_INVITE_SECRET", "PARENTAL_CONSENT_RECEIPT_SECRET"]) {
  if (missing(env[key]))
    warnings.push(`${key} unset — inherits JWT_ACCESS_SECRET; set a distinct value`);
  else if (weakSecret(env[key])) fatal.push(`${key} set but weak`);
}
if (missing(env.DATABASE_URL))
  fatal.push("DATABASE_URL unset — would use ephemeral in-memory stores");
if (missing(env.REDIS_URL))
  fatal.push("REDIS_URL unset — required for multi-instance throttling + scheduler");

if (missing(env.RESEND_API_KEY))
  warnings.push("RESEND_API_KEY unset — consent/notification emails NOT delivered");
else if (missing(env.EMAIL_FROM)) warnings.push("EMAIL_FROM unset — set a Resend-verified sender");
if (missing(env.PUBLIC_APP_URL)) warnings.push("PUBLIC_APP_URL unset — consent links may 404");

for (const key of ["TUTOR_SERVICE_URL", "SOLVER_SERVICE_URL", "VALIDATION_SERVICE_URL"]) {
  const v = env[key];
  if (missing(v)) warnings.push(`${key} unset — defaults to localhost (wrong in production)`);
  else if (/localhost|127\.0\.0\.1/.test(v)) warnings.push(`${key}=${v} points at localhost`);
}

for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const f of fatal) console.error(`❌ ${f}`);

if (fatal.length) {
  console.error(`\nPreflight FAILED: ${fatal.length} fatal problem(s).`);
  process.exit(1);
}
console.log(`✅ Preflight passed${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
