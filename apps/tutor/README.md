# tutor

GoMaths Tutor App — for independent human tutors offering paid 1:1 or small-group sessions through the GoMaths marketplace.

## Platforms
- iOS, Android, Web (Expo + Expo Web)

## Phase
**Phase 1.5** — *gated on positive Phase 1 pilot signals.* See `docs/Tutor_Marketplace_Plan.md`.

## Purpose
This app is **for tutors, not for parents or students**. Discovery, browsing, and booking happen inside the existing Parent and Student apps (which gain new marketplace surfaces in Phase 1.5).

## Core surfaces
- Tutor profile management (bio, subjects, grades, rate, languages, photo, qualifications)
- Verification queue (upload ID, SACE registration if applicable, police clearance certificate, qualifications)
- Availability calendar (recurring slots + one-off blocks)
- Incoming booking requests (accept / decline / reschedule)
- Active sessions list (today, this week)
- In-session tools: video, shared whiteboard, screen share, math input pad, KaTeX-rendered chat, session recording
- Past sessions + notes per learner
- Earnings dashboard (gross, fees, net, payout history)
- Payout settings (bank details, tax info — IRP6 / VAT)
- Reviews + ratings received
- Dispute handling (initiate / respond)

## Distinction from Teacher app
- Teacher = SACE-registered, school-affiliated, B2B
- Tutor = independent contractor, B2C marketplace, paid per session

Different app, different identity model, different compliance regime. They share backend services (curriculum, AI assist) but **not** user accounts unless a person explicitly registers as both (separate flows, separate vetting).

## Compliance — non-trivial
Listed in detail in `docs/Tutor_Marketplace_Plan.md`. Headline items:
- Police clearance for any tutor working with minors
- POPIA + Children's Act for session recordings
- FSCA-aware payment flow (probably via a SA payment facilitator: Stitch, Paystack, Yoco, or PayFast)
- Independent contractor tax handling (IRP6 / VAT thresholds)
- Platform liability — engage SA legal counsel before launch

## Status
Not scaffolded. Phase 1.5 — engineering does not begin until Phase 1 pilot is in market and showing positive learning signal.
