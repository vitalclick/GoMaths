import { inspectConfig } from "./config.validation";

const STRONG = "x".repeat(40);

/** A fully-configured production-grade environment. */
function fullEnv(): Record<string, string> {
  return {
    NODE_ENV: "production",
    JWT_ACCESS_SECRET: STRONG,
    JWT_REFRESH_SECRET: STRONG,
    PARENTAL_CONSENT_INVITE_SECRET: STRONG,
    PARENTAL_CONSENT_RECEIPT_SECRET: STRONG,
    DATABASE_URL: "postgresql://u:p@db:5432/gomaths",
    REDIS_URL: "redis://cache:6379",
    RESEND_API_KEY: "re_live_xxx",
    EMAIL_FROM: "GoMaths <consent@gomaths.co.za>",
    PUBLIC_APP_URL: "https://gomaths.co.za",
    TUTOR_SERVICE_URL: "https://tutor.internal",
    SOLVER_SERVICE_URL: "https://solver.internal",
    VALIDATION_SERVICE_URL: "https://validation.internal",
    SENTRY_DSN: "https://abc@sentry.io/1",
  };
}

describe("inspectConfig", () => {
  it("reports no fatal problems for a fully-configured environment", () => {
    const { fatal } = inspectConfig(fullEnv());
    expect(fatal).toEqual([]);
  });

  it("flags missing DATABASE_URL and REDIS_URL as fatal", () => {
    const env = fullEnv();
    delete env.DATABASE_URL;
    delete env.REDIS_URL;
    const { fatal } = inspectConfig(env);
    expect(fatal.some((f) => f.includes("DATABASE_URL"))).toBe(true);
    expect(fatal.some((f) => f.includes("REDIS_URL"))).toBe(true);
  });

  it("treats the dev-default JWT secret as fatal", () => {
    const env = fullEnv();
    env.JWT_ACCESS_SECRET = "dev-access-secret-change-me";
    const { fatal } = inspectConfig(env);
    expect(fatal.some((f) => f.includes("JWT_ACCESS_SECRET"))).toBe(true);
  });

  it("treats a too-short secret as fatal", () => {
    const env = fullEnv();
    env.JWT_REFRESH_SECRET = "short";
    const { fatal } = inspectConfig(env);
    expect(fatal.some((f) => f.includes("JWT_REFRESH_SECRET"))).toBe(true);
  });

  it("warns (not fatal) when consent secrets are unset — they inherit JWT", () => {
    const env = fullEnv();
    delete env.PARENTAL_CONSENT_INVITE_SECRET;
    delete env.PARENTAL_CONSENT_RECEIPT_SECRET;
    const { fatal, warnings } = inspectConfig(env);
    expect(fatal).toEqual([]);
    expect(warnings.some((w) => w.includes("PARENTAL_CONSENT_INVITE_SECRET"))).toBe(true);
  });

  it("warns when mail is log-only and when AI URLs point at localhost", () => {
    const env = fullEnv();
    delete env.RESEND_API_KEY;
    env.TUTOR_SERVICE_URL = "http://localhost:8001";
    const { warnings } = inspectConfig(env);
    expect(warnings.some((w) => w.includes("LOG-ONLY"))).toBe(true);
    expect(warnings.some((w) => w.includes("TUTOR_SERVICE_URL"))).toBe(true);
  });

  it("summarises active vs fallback subsystems", () => {
    const summary = inspectConfig(fullEnv()).summary.join("\n");
    expect(summary).toContain("Postgres");
    expect(summary).toContain("Resend");
  });
});
