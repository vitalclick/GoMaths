# Runbooks

Operational procedures for the GoMaths team. Each runbook is one page —
actionable steps for the on-call engineer, not background reading.

| Runbook | When to use it |
|---|---|
| [`incident-response.md`](./incident-response.md) | Any unplanned outage or production incident |
| [`tutor-outage.md`](./tutor-outage.md) | AI tutor is degraded — slow replies, wrong maths, or error rate spike |
| [`popia-dsr.md`](./popia-dsr.md) | A data subject (or their guardian) sends an access / deletion request |
| [`curriculum-rollback.md`](./curriculum-rollback.md) | A bad lesson or question reaches production |
| [`payment-dispute.md`](./payment-dispute.md) | A parent disputes a tutor session charge (Phase 1.5) |

## House rules

1. **Communicate first, fix second.** A two-line "investigating" message in the on-call Slack channel is more valuable than 20 minutes of silent debugging.
2. **Write the postmortem within 5 working days.** Template at the end of `incident-response.md`. No blame; the question is always "what made it possible?"
3. **Never skip the user-comms step.** If a learner saw wrong maths or a parent saw incorrect progress, they hear from us — not from a teacher noticing two weeks later.
4. **Tabletop these every quarter.** Run through one runbook with a synthetic scenario; capture which steps are stale and PR the runbook.
