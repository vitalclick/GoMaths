# Payment dispute (Phase 1.5 — Tutor Marketplace)

A parent has disputed a charge for a tutor session. Either:

- **Chargeback** — the parent went to their bank, not us. The payment facilitator (Stitch / PayFast / Paystack-SA) tells us via webhook.
- **In-app dispute** — the parent tapped "I have a problem with this session" in the Parent app.
- **Email / WhatsApp** — out-of-band complaint to support.

Goal: investigate fast, refund cleanly when justified, capture the
signal so we improve trust + safety.

> Chargebacks have a hard deadline (typically 7–10 working days from
> our being notified) before we lose the dispute by default. **Treat
> as SEV-2 minimum.** Move within 2 working days.

---

## 1. Triage (first 30 minutes)

Get the basics in front of you:

```sh
SESSION_ID="<the tutoring session id>"

# Session + booking + payment
psql "$DATABASE_URL" -c "
  SELECT s.*, b.*, p.*
  FROM \"TutorSession\" s
  JOIN \"TutorBooking\" b ON b.id = s.\"bookingId\"
  JOIN \"Payment\" p ON p.\"bookingId\" = b.id
  WHERE s.id = '$SESSION_ID';"

# Tutor profile (for context — vetting status, prior ratings, prior disputes)
psql "$DATABASE_URL" -c "
  SELECT t.*, COUNT(d.id) AS prior_disputes
  FROM \"Tutor\" t
  LEFT JOIN \"Dispute\" d ON d.\"tutorId\" = t.id AND d.\"resolvedAt\" IS NOT NULL
  WHERE t.id = (SELECT \"tutorId\" FROM \"TutorBooking\" WHERE id = '$BOOKING_ID')
  GROUP BY t.id;"

# Did the session actually happen?  Session metadata from the video provider
# (LiveKit / Daily) — duration, both parties present, recording url.
```

Decision tree:

| Signal                                                                | Action                                                                                                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session never started (no video join from tutor)                      | **Refund 100%.** Tutor no-show.                                                                                                                                        |
| Tutor joined < 5 min late, then disconnected and never rejoined       | **Refund 100%.** Tutor partial no-show.                                                                                                                                |
| Both joined, session ran ~full duration, parent says quality was poor | Watch the recording (with the consent already captured at booking — see POPIA below). If clearly substandard, refund. If competent but parent disagrees, mediate.      |
| Both joined, parent disputes that the session happened at all         | Pull the video provider's join logs. The recording is the source of truth.                                                                                             |
| Chargeback for "fraud" (parent claims they never booked)              | Investigate device + IP + login history; common cause is a child booking on a parent's card. **Refund** but **don't penalise the tutor** — fee comes from our reserve. |

## 2. Refund mechanics

```sh
# Via the payment facilitator's API (example shape — confirm against
# the chosen provider's docs, see DEPLOYMENT_INFO.md §10):
curl -X POST https://api.stitch.money/refunds \
  -H "authorization: Bearer $STITCH_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "paymentId": "<facilitator payment id>",
    "amount": <amount-in-cents>,
    "reason": "tutor_no_show | quality | unauthorised | other",
    "metadata": { "internalDisputeId": "<dispute id>" }
  }'

# Record the refund. The Payment row should auto-update on the
# webhook from the facilitator, but record the decision regardless.
psql "$DATABASE_URL" -c "
  INSERT INTO \"Dispute\" (id, \"bookingId\", \"reason\", \"resolution\",
    \"refundCents\", \"openedAt\", \"resolvedAt\", \"openedBy\", \"resolvedBy\")
  VALUES (gen_random_uuid()::text, '$BOOKING_ID', '<reason>',
    '<resolution-text>', <cents>, NOW(), NOW(), '<parent-user-id>',
    '<staff-user-id>');"
```

## 3. The tutor side

When the dispute is upheld:

- **Tutor no-show**: no payout for the session. Tutor's reliability
  metric ticks down — three no-shows in 30 days suspends the tutor
  pending review.
- **Quality**: payout still happens (the tutor's time was real) **unless**
  the recording shows misconduct or wildly off-curriculum content. If
  it's a coaching opportunity, send the recording timestamp + a private
  note via the Tutor app.
- **Unauthorised (chargeback)**: payout doesn't happen for this session.
  No reliability penalty (it wasn't the tutor's fault).

Always notify the tutor — silent decisions destroy trust faster than
unfavourable ones. Template:

> Hi <name> — we're refunding the parent for session <id> on <date>.
> Reason: <one sentence>. <Payout impact statement>. No reliability
> impact / one reliability strike. The recording of the relevant
> moment is at <timestamp>. Reply here if you'd like to discuss.

## 4. Safety-critical disputes

These bypass the normal flow and go directly to the Information Officer + legal:

- Any allegation of **inappropriate conduct** with a minor
- Any allegation that the tutor was **impaired** (alcohol, substances)
- The tutor **shared personal contact details** with the learner outside the platform
- The tutor **promoted external services / paid arrangements off-platform**

Procedure:

1. **Suspend the tutor's account immediately** — flip `Tutor.suspendedAt`
   to `now()`. They can't accept new bookings.
2. **Preserve the recording**. Copy to a legal-hold S3 bucket; do NOT
   delete on the normal 90-day retention window.
3. **Notify the parent** within 24 hours that we're investigating and
   the tutor has been suspended pending review.
4. **Engage legal counsel** (per `DEPLOYMENT_INFO.md §9`) before any
   further comms.

POPIA + Children's Act recording-access notes:

- Parental consent for recording was captured at booking.
- Internal review of recordings is permitted for trust + safety;
  log every access with reviewer + timestamp + reason.
- The recording **is not** forwarded to the tutor or the parent unless
  legal counsel signs off.

## 5. Documenting + learning

Every dispute generates a one-paragraph internal note:

```md
**Dispute <id>** — <date>

- Session: <date>, <duration>, <subject/topic>
- Parent: <name redacted>, <city>
- Tutor: <name redacted>, <vetting tier>
- Reason: <one sentence>
- Resolution: <refund/no-refund>, <reliability impact>, <comms summary>
- Lesson: <what we'd change>
```

Aggregate monthly into the trust + safety dashboard. Patterns to watch:

- Same tutor → multiple disputes
- Same parent → multiple disputes (could be billing confusion, could be abuse of the refund policy)
- Same time-of-day → tutor multitasking?
- Same topic → curriculum mismatch with the tutor's expertise

## 6. Phase 1.5 build dependencies

This runbook references models that don't yet exist in `schema.prisma`:
`TutorSession`, `TutorBooking`, `Payment`, `Tutor`, `Dispute`. They land
with the Phase 1.5 build (see `docs/Tutor_Marketplace_Plan.md`). Until
then this file is a forward-looking spec — review it with the team
designing the marketplace data model so the schema captures what the
runbook needs.
