# parent

GoMaths Parent App.

## Platforms
- iOS, Android, Web (Expo + Expo Web)

## Purpose
Give parents visibility into their child's learning + actionable nudges.

## Core surfaces
- Child(ren) selector (linked accounts)
- Weekly progress summary + strengths/weaknesses
- Time-on-task chart
- Recent activity feed
- Subscription & billing
- Push notifications (streak reminders, achievements, weekly digest)
- Optional: read-only view of recent AI tutor conversations (parental controls per POPIA)

## Stack
Same Expo + NativeWind + shared `packages/*` as student app. See `apps/student/README.md`.

## Compliance notes
- POPIA: parental consent flow for under-18 learners initiates here
- App Store / Play Store: not a kids' app per se (parents are adults), but **the linked child experience falls under Apple Kids Category / Google Designed for Families**. Plan store metadata accordingly.

## Status
Not yet scaffolded.
