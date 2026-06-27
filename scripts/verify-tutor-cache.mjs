#!/usr/bin/env node
/**
 * Verify the Anthropic prompt-cache assumption (HANDOFF.md, known risk #1).
 *
 * The tutor service ships `cache_control: ephemeral` on its system blocks.
 * If caching is actually working, the second request that reuses the same
 * persona + topic context should report cached input tokens, pushing
 * `cache_hit_ratio` above 0. If it stays at 0, the LLM bill is roughly 10x
 * what the per-learner cost model assumes — so this must be verified before
 * quoting onboarding pricing.
 *
 * What it does: sends two /chat requests for the same topic, then reads
 * /metrics/cache and asserts cache_hit_ratio > 0.
 *
 * Usage:
 *   TUTOR_SERVICE_URL=https://tutor.internal node scripts/verify-tutor-cache.mjs
 *   node scripts/verify-tutor-cache.mjs            # defaults to localhost:8001
 *
 * Exit codes: 0 = cache working (or skipped on mock), 1 = failure / ratio 0.
 */

const BASE = process.env.TUTOR_SERVICE_URL ?? "http://localhost:8001";
const TOPIC = process.env.TUTOR_VERIFY_TOPIC ?? "g9.alg.linear-eq";

async function getJson(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}

async function chat(message) {
  return getJson("/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, topic_id: TOPIC, history: [] }),
  });
}

async function main() {
  console.log(`Tutor service: ${BASE}`);

  const health = await getJson("/health");
  console.log(`Provider: ${health.provider}`);
  if (health.provider === "mock") {
    console.warn(
      "⚠️  Provider is 'mock' — prompt caching is a no-op. Set TUTOR_PROVIDER + a real " +
        "API key on the tutor service and re-run. Skipping cache assertion.",
    );
    process.exit(0);
  }

  // Two requests against the same topic; the second should hit the cache.
  await chat("Can you explain how to solve a linear equation?");
  await chat("Why do we do the same thing to both sides?");

  const metrics = await getJson("/metrics/cache");
  const ratio = Number(metrics.cache_hit_ratio ?? 0);
  console.log(`cache_hit_ratio: ${ratio}`);
  console.log(metrics);

  if (ratio > 0) {
    console.log("✅ Prompt caching is working — cost model assumption holds.");
    process.exit(0);
  }
  console.error(
    "❌ cache_hit_ratio is 0 after a warm request. Prompt caching is NOT effective — " +
      "the LLM bill will be ~10x the per-learner budget. Investigate before quoting pricing.",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(`❌ verify-tutor-cache failed: ${err.message}`);
  process.exit(1);
});
