# GoMaths Tutor Marketplace — Phase 1.5 Plan

**Version:** 0.2 (Draft)
**Status:** Planned — gated on v2 launch outcome signal
**Owner:** TBD
**Target start:** After v2 has cut over its first school and the
learning-outcome metric beats the v1 control by the threshold in §1.
**Target launch:** ~6 months after Phase 1.5 kickoff.

---

## 1. Why a separate plan, separate phase

The Tutor Marketplace is a different product from the school-affiliated GoMaths apps. It has:

- A different sales motion (B2C marketplace, not B2B license)
- A different revenue model (per-session commission, not subscription)
- A different compliance regime (independent contractors, child-safety liability sits with us)
- Different operations (vetting, dispute resolution, payouts)
- A different unit economics question (CAC for parents finding tutors vs. CAC for schools)

It is the _right_ second business for GoMaths — but **only if v2 proves the learning hypothesis vs v1**. The marketplace amplifies whatever the core product does. If v2 doesn't move outcomes against v1, the marketplace amplifies nothing.

**Gating condition:** v2's first-cutover school shows ≥ 6 percentage-point improvement on the Grade 9 CAPS assessment over the v1 control cohort (lowered from the Phase 1 internal target of 8 to allow an earlier go-decision). If the gate is missed, Phase 1.5 pauses, money is redirected to fixing the v2 learning loop.

---

## 2. Two Surfaces

### 2.1 Tutor App (new — `apps/tutor/`)

For the tutors themselves. iOS + Android + Web.

- Profile, verification, availability, bookings, in-session tools, earnings, taxes, reviews, disputes

### 2.2 Marketplace surfaces inside existing apps

Added features inside apps that already ship.

**Parent app:**

- Find a tutor (search by subject, grade, language, price, rating, availability)
- Tutor profile pages (bio, video intro, qualifications, reviews)
- Book session (calendar selection, payment)
- Manage upcoming sessions
- Join session (deep link into video room)
- Rate + review after session
- Re-book favourites

**Student app:**

- Join scheduled session (read-only access; parent owns the booking)
- Session history with notes/recordings
- "Ask my tutor" — async question to a previously booked tutor (paid feature)

**Internal Admin app:**

- Tutor onboarding queue (review verification, approve/reject)
- Live moderation: ongoing session monitoring (audit access only, not surveillance)
- Dispute review and resolution
- Payouts ops
- Trust & safety reports

---

## 3. Out of Scope (Phase 1.5)

- Group classes (multi-student bookings) → Phase 2 of marketplace
- Tutor-led courses / cohorts → Phase 2
- Subscription packages (parents prepay for N hours) → Phase 2
- Tutor matching algorithm beyond filters (ML-based) → Phase 2
- Cross-border tutoring (SA students with tutors in Kenya etc.) → much later
- Languages other than English → Phase 2

---

## 4. Compliance — The Hard Part

This is the section that makes or breaks Phase 1.5. Underestimating it kills the timeline.

### 4.1 Child safety + vetting

Every tutor working with minors needs:

- Valid SA Police Clearance Certificate (PCC)
- ID verification (Smart ID / passport)
- Form 30 from the National Child Protection Register (Children's Act § 126) — confirms tutor is not listed as unsuitable to work with children
- Qualification verification (where claimed)
- Reference check (minimum 2)

**Operational requirement:** a small vetting team (1–2 FTE in Phase 1.5) processing applications. Plan for ~3–5 business day turnaround.

**Re-verification:** annually for PCC + Form 30.

### 4.2 Session recordings + POPIA

Recording 1:1 sessions with minors is sensitive:

- Explicit parental consent at booking, not buried in ToS
- Clear retention policy (recommend: 90 days, then delete unless flagged for dispute)
- Strict access control (tutor cannot re-download; parent + student can re-watch; admin only on dispute)
- Data residency: af-south-1 only
- Right to delete (POPIA Section 24) handled within 30 days

### 4.3 Payments

Two viable paths in SA:

- **Marketplace via existing facilitator** (Stitch, Paystack-SA, PayFast, Yoco): we take payment from parent, facilitator handles split payout to tutor, we keep our commission. Lower compliance burden but pay facilitator fees (3–5% per transaction).
- **Become a payment facilitator ourselves**: more revenue but requires FSCA registration, capital requirements, audit. **Don't do this in Phase 1.5.** Maybe Phase 3+.

**Recommendation:** Stitch for SA-first marketplaces; falls back to PayFast if Stitch coverage is wrong. Decide in Month 10.

### 4.4 Tutor tax status

Tutors are **independent contractors**, not employees:

- They must register with SARS
- VAT registration mandatory if turnover ≥ R 1M / 12 months (track per-tutor turnover, prompt when nearing threshold)
- We issue IRP6 / IT3(a) where applicable
- ToS must make non-employment status explicit (avoid "deemed employment" by SARS)

**Engage a SA tax practitioner before launch.** Cost: ~R 30–60K for setup, R 10–20K/month ongoing.

### 4.5 Platform liability

Realistically: parents will sue GoMaths if a tutor does something harmful. Our ToS limit but don't eliminate liability.

- ToS reviewed by SA legal counsel (Consumer Protection Act + Children's Act)
- Liability insurance: platform/marketplace cover. Quote from a SA broker before launch.
- Incident response runbook for trust & safety events (recommend tabletop-testing in Month 14)

### 4.6 Marketing to minors

The marketplace surfaces inside the Student app must not target children directly for commercial transactions — the **parent is the buyer**, always. UX must reinforce this:

- Booking flow always requires parental account
- Student app never shows pricing without parental gate
- Student app cannot initiate a booking — only join one

---

## 5. Team & Timeline

### Team (added on top of the v2 team)

| Role                          | Count | Notes                                                  |
| ----------------------------- | ----- | ------------------------------------------------------ |
| Product Manager (Marketplace) | 1     | Owns marketplace P&L                                   |
| Designer                      | 1     | Marketplace flows in 3 apps                            |
| Expo Engineers                | 3     | New Tutor app + marketplace surfaces in Parent/Student |
| Backend Engineer              | 1     | Booking, payments, sessions, search                    |
| Real-time / Video Engineer    | 1     | LiveKit or Daily.co integration; in-session tooling    |
| Trust & Safety Ops            | 2     | Vetting + disputes                                     |
| Legal (fractional)            | 0.25  | SA marketplace + children's law                        |
| Tax practitioner (fractional) | 0.1   | SARS / VAT / IRP6                                      |

**Total marginal team: ~9 FTE for the duration.**

### Timeline (≈ 6–8 months from kickoff)

Months are relative to Phase 1.5 kickoff (which is gated on the v2
launch outcome signal — see §1).

| Month | Work                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------- |
| 0     | Kickoff (gated on v2 outcome signal). Hire vetting ops. Engage legal + tax. Decide payment provider. |
| 1     | Tutor verification flow + admin vetting queue. Tutor app profile + availability.                     |
| 2     | Booking flow in Parent app. Calendar + scheduling backend.                                           |
| 3     | Video + in-session tooling (third-party SDK; LiveKit recommended).                                   |
| 4     | Payments integrated. Payout flow. Tax forms.                                                         |
| 5     | Reviews, ratings, disputes. Trust & safety tooling.                                                  |
| 6     | Closed beta — 5–10 hand-picked tutors, 20 parent accounts.                                           |
| 7     | Expand vetted tutor pool to ~50. Public launch in initial cities.                                    |
| 8     | Stabilise; measure unit economics; decide what comes next.                                           |

---

## 6. Budget Envelope (Indicative, ZAR)

| Line item                                                             | Low         | High      |
| --------------------------------------------------------------------- | ----------- | --------- |
| Engineering (9 FTE × 7 months avg)                                    | R 2.5M      | R 3.6M    |
| Trust & safety ops (2 FTE × 9 months, including hire+train)           | R 540K      | R 800K    |
| Video SDK (LiveKit / Daily) at pilot scale                            | R 80K       | R 200K    |
| Payments fees (built-in; not capex)                                   | n/a         | n/a       |
| Legal + tax setup                                                     | R 150K      | R 280K    |
| Platform liability insurance (annual)                                 | R 80K       | R 180K    |
| Background-check service integration                                  | R 40K       | R 100K    |
| Vetting per-tutor cost (PCC + Form 30 + references; first 100 tutors) | R 50K       | R 120K    |
| Marketing for tutor recruitment                                       | R 200K      | R 500K    |
| Contingency (20% — higher than Phase 1, more unknowns)                | R 750K      | R 1.2M    |
| **Total**                                                             | **~R 4.4M** | **~R 7M** |

This is **incremental** spend on top of GoMaths' existing operating
budget — v1 plus the v2 rebuild lines in
`docs/Phase1_Launch_Plan.md §9`.

---

## 7. Success Metrics (Phase 1.5)

### Marketplace health (months 1–6 post-launch)

- ≥ 50 vetted tutors live
- ≥ 1,500 booked sessions in first 6 months
- ≥ 60% session completion rate (booked + happened + paid out)
- < 2% dispute rate
- Average tutor rating ≥ 4.5 / 5
- ≥ 30% of paying parents become repeat bookers within 90 days

### Trust & safety (zero tolerance)

- 0 unverified tutors active
- 100% of session recordings deleted within retention window
- All disputes resolved within 7 business days

### Unit economics

- Net revenue per session (after facilitator + payout) ≥ R 35
- CAC per paying parent < R 500
- LTV : CAC ≥ 3:1 by month 6

---

## 8. Key Risks

| Risk                                   | Severity     | Mitigation                                                                               |
| -------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| Trust incident (tutor misconduct)      | **Critical** | Strict vetting; recording + retention; tabletop incident drills; liability insurance     |
| v2 outcome gate fails vs v1            | High         | Marketplace doesn't ship; money is redirected — that's the point of the gate             |
| Tutor supply doesn't scale             | High         | Recruit in Months 11–13 in parallel with build; aim for 100+ vetted by launch            |
| Parent demand doesn't materialise      | High         | Soft-pilot with 20 invited parents at Month 16 before public launch                      |
| Payments fraud                         | Medium       | Use facilitator's fraud tooling; cap first-time-customer transaction size                |
| SARS / FSCA pushback on classification | Medium       | Strong contracts, tax practitioner from Day 1, don't hold tutor funds longer than needed |
| Video reliability on 3G                | Medium       | Test on real SA networks; fallback to audio + whiteboard if bandwidth fails              |

---

## 9. Decisions Required Before Phase 1.5 Kickoff

1. **Pilot signal gate met?** If not, pause.
2. **Payment facilitator:** Stitch vs. PayFast vs. Paystack-SA — decide Month 9
3. **Video provider:** LiveKit (recommended, self-hostable) vs. Daily.co vs. Twilio
4. **Background-check provider:** there are several SA-based services; vet 2–3 before kickoff
5. **Pricing model:** flat 15–20% commission vs. tiered vs. subscription for tutors — decide Month 10 with input from supply-side research
6. **Geographic launch:** Cape Town + Joburg first, or open SA-wide? Decide Month 14
7. **Tutor minimum bar:** SACE registration required, or qualified-but-unregistered allowed? (Affects supply size enormously.) Decide Month 10

---

## 10. Strategic Notes

**Why this is potentially huge for GoMaths**

Most parents in SA wanting tutoring rely on word-of-mouth and unstructured WhatsApp networks. There is no dominant marketplace. A trusted, GoMaths-branded marketplace — _combined with_ the AI tutor, _combined with_ the curriculum content, _combined with_ the school relationships built in Phase 1 — is a defensible position no global edtech currently occupies in SA.

**Why this could still fail**

Marketplaces are hard. They need supply and demand simultaneously, and both sides churn fast if early experience is bad. The first 100 tutors and the first 500 parents will determine whether this becomes a flywheel or a drain. Treat the soft-pilot at Month 16 as the real proof point — not the public launch at Month 17.
