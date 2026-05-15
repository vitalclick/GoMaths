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

## Push notifications integration

The backend already exposes `/api/notifications/tokens` and ships a
working `NotificationsService` (Expo Push API client, per-app-slug
fan-out). When this app is scaffolded:

1. Add `expo-notifications` + `expo-device` to dependencies.
2. Copy `apps/student/lib/push.ts` over and change `APP_SLUG = "parent"`.
3. Call `registerForPush()` from the auth provider after sign-in.
4. Backend can then target the parent's devices via:
   ```ts
   notifications.send({
     userId: parent.id,
     title: "Weekly digest ready",
     body: "Tap to see how Aisha did this week",
     appSlug: "parent",
     data: { kind: "weekly-digest" },
   });
   ```

Streak-reminder + weekly-digest cron jobs live on the backend (Phase 2)
and call `NotificationsService.send` with the right `appSlug`.

## Status
Not yet scaffolded.
