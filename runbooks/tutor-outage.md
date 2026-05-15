# Tutor outage / degradation

The AI tutor has four ways it can fail visibly to learners:

1. **Upstream LLM is down** (Anthropic / OpenAI returning 5xx or timing out).
2. **Upstream is slow** — replies take >12s p95, students see the cursor and lose patience.
3. **Wrong maths** — the LLM produces incorrect answers, the SymPy validator catches some but not all.
4. **Rate limit eaten by abuse** — one student or attacker burns the per-student quota; legitimate use is throttled.

## Detection signals

- Sentry error rate on `services/ai-services/tutor` spikes
- `/api/health` and `/api/tutor/messages/stream` latency p95 climbs (CloudWatch on the ALB)
- Validated-reply ratio drops below baseline (Phase 1 metric — emit `verified_claims / extracted_claims` ratio to CloudWatch)
- Teacher / parent reports of "Maya isn't answering" or "Maya gave my child a wrong answer"

## 1. Confirm

```sh
curl -fsS https://api.gomaths.co.za/api/health
curl -fsS http://tutor:8001/health   # in-cluster

# Hit /chat directly with a known prompt to bisect:
curl -fsS -X POST http://tutor:8001/chat \
  -H 'content-type: application/json' \
  -d '{"student_id":"smoke","message":"solve 2x + 5 = 13"}'
```

If `/chat` returns 5xx or times out → it's upstream LLM. If it returns a reply with `validated=false` and an obviously wrong answer → it's a quality problem, not an availability one.

## 2. Mitigate

### A. Provider degraded (5xx / timeouts)

Swap providers in seconds — both Anthropic and OpenAI implementations ship with the service.

```sh
# In production env (AWS Secrets Manager / Kubernetes secret):
TUTOR_PROVIDER=openai     # or anthropic, whichever is healthy
ANTHROPIC_API_KEY=...     # already set
OPENAI_API_KEY=...        # already set
```

Restart the `ai-services-tutor` deployment. ~30s.

If **both** providers are down, fall back to the mock provider — learners will see a deterministic "I can't reach Maya right now" message instead of a timeout:

```sh
TUTOR_PROVIDER=mock
```

### B. Provider slow

- Reduce `max_tokens` (currently 600) via env override → shorter replies, faster TTFT.
- Disable streaming on the client (`/api/tutor/messages` vs. `/api/tutor/messages/stream`) — the UI fallback path still works.
- Scale the `ai-services-tutor` deployment replicas — sometimes the bottleneck is concurrent in-flight requests on one pod.

### C. Wrong maths

This is the worst kind of outage for trust. **Stop the tutor before it makes things worse:**

```sh
TUTOR_PROVIDER=mock
```

Then:
1. Pull a sample of the bad replies from `Conversation` rows (`role=MAYA`, `validated=false`, recent).
2. Identify the pattern — a specific topic? A specific question shape? A model regression?
3. Decide: tighten the system prompt, switch model, or block traffic on the affected topic.
4. Phase 1 protective action: add a hard-coded denylist of `topic_id` values the tutor won't answer until the system prompt is patched.

### D. Rate-limit abuse

```sh
# Inspect Redis for runaway keys
redis-cli -u "$REDIS_URL" --scan --pattern 'gomaths:throttle:u:*' | head -50

# Manually revoke a student session if abuse is confirmed:
psql "$DATABASE_URL" -c \
  "UPDATE \"Session\" SET \"revokedAt\" = now() WHERE \"userId\" = '<id>';"
```

If the abuse is global (script kiddie testing the API): tighten the `tutor` throttler temporarily — edit `throttling.module.ts` `limit: 20` → `limit: 5` and hotfix-deploy.

## 3. Communicate

- **Status update to pilot schools** for any SEV-1/SEV-2: clear, non-technical. Example:
  > "Maya is taking a quick break while we fix a slow connection to her thinking service. Lessons and practice work as normal. We'll let you know when she's back — within 30 minutes."
- **For wrong-maths events**: explicitly tell affected teachers that learners may have seen incorrect work, with a sample. Trust depends on us catching this before they do.

## 4. Postmortem-specific questions

- Did the validator catch the bad replies? If not, why? (Regex extractor too narrow? SymPy parse failure?)
- Did our provider abstraction make the swap fast, or did we hit a dependency we hadn't tested?
- Did learners hit a rate limit because of the fix, not the cause?
