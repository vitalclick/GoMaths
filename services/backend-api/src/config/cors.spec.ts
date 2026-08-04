import { parseCorsOrigins, resolveCorsOptions, toOriginMatcher } from "./cors";

describe("parseCorsOrigins", () => {
  it("returns an empty list when unset or blank", () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins("")).toEqual([]);
    expect(parseCorsOrigins("  , ,")).toEqual([]);
  });

  it("splits on commas and trims surrounding whitespace", () => {
    expect(parseCorsOrigins("https://a.co.za, https://b.co.za")).toEqual([
      "https://a.co.za",
      "https://b.co.za",
    ]);
  });
});

describe("toOriginMatcher", () => {
  it("passes plain origins through unchanged for exact matching", () => {
    expect(toOriginMatcher("https://gomaths.co.za")).toBe("https://gomaths.co.za");
  });

  it("matches a single label where the pattern has a wildcard", () => {
    const matcher = toOriginMatcher("https://*.gomaths-student.pages.dev") as RegExp;

    expect(matcher.test("https://a1b2c3.gomaths-student.pages.dev")).toBe(true);
    expect(matcher.test("https://gomaths-student.pages.dev")).toBe(false);
  });

  it("does not let a wildcard span dots or reach another domain", () => {
    const matcher = toOriginMatcher("https://*.pages.dev") as RegExp;

    expect(matcher.test("https://evil.com/.pages.dev")).toBe(false);
    expect(matcher.test("https://a.b.pages.dev")).toBe(false);
    expect(matcher.test("https://preview.pages.dev.evil.com")).toBe(false);
  });

  it("treats dots literally rather than as regex wildcards", () => {
    const matcher = toOriginMatcher("https://*.gomaths.co.za") as RegExp;

    expect(matcher.test("https://appXgomaths.co.za")).toBe(false);
  });
});

describe("resolveCorsOptions", () => {
  it("disables CORS entirely in production when no allowlist is configured", () => {
    expect(resolveCorsOptions({ NODE_ENV: "production" })).toBe(false);
  });

  it("reflects any origin outside production so local web dev works", () => {
    const options = resolveCorsOptions({ NODE_ENV: "development" });

    expect(options).not.toBe(false);
    expect((options as { origin: unknown }).origin).toBe(true);
  });

  it("honours the allowlist in production", () => {
    const options = resolveCorsOptions({
      NODE_ENV: "production",
      CORS_ORIGINS: "https://gomaths.co.za,https://*.pages.dev",
    });

    expect(options).not.toBe(false);
    const origin = (options as { origin: (string | RegExp)[] }).origin;
    expect(origin[0]).toBe("https://gomaths.co.za");
    expect(origin[1]).toBeInstanceOf(RegExp);
  });

  it("passes a bare wildcard through as the literal `*`", () => {
    const options = resolveCorsOptions({ NODE_ENV: "production", CORS_ORIGINS: "*" });

    expect((options as { origin: unknown }).origin).toBe("*");
  });

  it("never enables credentials — auth is Bearer-token only", () => {
    const options = resolveCorsOptions({
      NODE_ENV: "production",
      CORS_ORIGINS: "https://gomaths.co.za",
    });

    expect((options as { credentials: boolean }).credentials).toBe(false);
  });
});
