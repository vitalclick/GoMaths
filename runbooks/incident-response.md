# Incident response

> **Severity rule of thumb**
>
> - **SEV-1** — Learners can't sign in, lessons don't load, or wrong maths is being shown at scale. Wake people up.
> - **SEV-2** — A pilot school is affected; or a single critical feature (tutor / solver) is degraded for >15 min. Business hours response, but treat as urgent.
> - **SEV-3** — Bug with a workaround; non-critical feature offline. Next-day.
> - **SEV-4** — Cosmetic; backlog.
>
> When in doubt, declare a higher severity than feels comfortable. Down-grading is cheap; up-grading after damage is not.

---

## 1. Detect

Common detection paths (set up before pilot launch — Phase 1 TODO):

- **Sentry alert** — error rate exceeds baseline in `backend-api` or the Expo app
- **CloudWatch alarm** — RDS connections saturated, EKS pod restart loop, ALB 5xx > 1%
- **Pilot teacher / parent ping** in the shared Slack channel
- **Synthetic check** — Phase 1 should set up a 1-min loop hitting `/api/health` and a token-checked `/api/curriculum/grades/9`

## 2. Triage (first 10 minutes)

1. **Open an incident channel.** Slack: `#inc-<date>-<short-name>`. Pin the live status doc.
2. **Set severity + assign an Incident Commander (IC).** Anyone can be IC; it doesn't have to be the most senior person on the call. The IC's job is to coordinate, not to fix.
3. **Post a public-facing status update** if SEV-1 or SEV-2. One sentence: "We're aware of an issue affecting <X>. Investigating. Next update in <Y> minutes." Don't speculate on cause.
4. **Capture the working hypothesis** in the incident channel. Even if wrong, writing it down focuses the next step.

## 3. Investigate

Quick checks in roughly this order:

```sh
# 1. Is the backend up?
curl -fsS https://api.gomaths.co.za/api/health

# 2. Is the database reachable?
psql "$DATABASE_URL" -c 'select 1;'

# 3. Are AI services up?
curl -fsS http://tutor:8001/health   # via cluster, not public
curl -fsS http://solver:8002/health
curl -fsS http://validation:8003/health

# 4. Recent error spikes
# → Sentry → Issues → group by service → time range = last hour

# 5. Recent deploys (often the cause)
# → GitHub Actions → Deployments → look at last 2 hours
```

If the cause looks like a recent deploy: **roll back first, diagnose after**. Rolling forward when the cause is unclear costs more than rolling back and re-thinking.

## 4. Mitigate

Common mitigations:

- **Roll back the last deploy** (GitHub Actions → re-run a previous green workflow's deploy job, or `kubectl rollout undo`).
- **Disable a broken feature via env** — e.g., `TUTOR_PROVIDER=mock` to bypass a misbehaving LLM. See `tutor-outage.md`.
- **Tighten rate limits** if a runaway client is the cause. Edit `throttling.module.ts` limits and ship a hotfix.
- **Scale up** the affected deployment if it's load-driven (EKS HPA settings).

## 5. Communicate

- **Internal**: continuous updates in the incident channel — every meaningful event, even "tried X, no change."
- **External (pilot schools / parents)**: status update every 30 min during SEV-1, hourly during SEV-2. Same format: what we know, what we're doing, when we'll next update. **No technical jargon** in external comms.
- **Resolved**: post a clear "resolved" message with timestamp and a one-line cause.

## 6. Postmortem (within 5 working days)

Open a `docs/postmortems/YYYY-MM-DD-<slug>.md` PR with this template:

```md
# Postmortem — <short title>

**Date:** YYYY-MM-DD
**Severity:** SEV-?
**Duration:** start → end (e.g. 14:02–14:47 SAST = 45 min)
**Authors:** @…
**Status:** draft | review | published

## Summary

2–3 sentences. What broke, who was affected, how it ended.

## Timeline

Use UTC. Every meaningful action.

## Impact

Who saw what, for how long. Real numbers (DAU lost, requests failed, tutor messages dropped).

## Root cause

The actual cause. Not "X happened" — _why was X possible_.

## What went well

At least three items. Worth writing down what works.

## What didn't

At least three items. No blame; describe systems and incentives, not people.

## Action items

Bulleted, each with owner + due date + GitHub issue link. Numbered priorities. Don't write more than 5 — it's discipline; pick what matters.
```

The Action Items are the actual product of the postmortem. Anything else is documentation.
