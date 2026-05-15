# parent

GoMaths Parent App.

## Platforms

- iOS, Android, Web (Expo + Expo Web)

## Purpose

Give parents visibility into their child's learning + actionable nudges.

## Status

**Phase 1.5 scaffold.** This boots end-to-end:

- Login screen → backend `/api/auth/login`
- Tokens persist via `expo-secure-store` (web: localStorage), keyed
  separately from the Student app so a parent + child sharing a device
  can both sign in
- Push registration with `appSlug=parent` after login — backend already
  fans out via `NotificationsService.send({ ..., appSlug: "parent" })`
- Dashboard is a placeholder; surfaces real content once the linked-
  child + weekly-digest features ship in Phase 1.5

```sh
pnpm install
EXPO_PUBLIC_API_URL=http://localhost:4000 \
  pnpm --filter @gomaths/parent dev
```

## Architecture inheritance

- `@gomaths/design-tokens` + `@gomaths/ui` + `@gomaths/api-client` —
  same as Student app
- `@sentry/react-native` is included; init landed identically to
  Student. Phase 1.5 should set `appSlug` and `userId` on the Sentry
  scope.

## What's still to build (Phase 1.5 spec)

- Linked-child invite flow (handshake with the Student app's consent
  step that emits `parentalConsentToken`)
- Per-child weekly summary view (`/api/progress/summary` per linked
  child, fronted by a parent-scoped endpoint to be added in the
  backend)
- Time-on-task chart
- Recent-activity feed
- Subscription & billing (Stitch / Paystack — pending payments ADR)
- Read-only AI tutor conversation viewer (POPIA: parent can see, can't
  reply)

## Compliance notes

- POPIA: parental consent flow for under-18 learners is initiated by
  the Student app and confirmed via email
- App Store / Play Store: not a kids' app per se (parents are adults),
  but the linked child experience falls under Apple Kids Category /
  Google Designed for Families — plan store metadata accordingly.
