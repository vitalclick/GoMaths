# school

GoMaths School Admin — for principals, school admins, and bursars.

## Platforms
- **Web (primary)** — Next.js App Router. Lives in the responsive web build of this directory.
- **iOS + Android (companion)** — Expo. Lightweight app for notifications, approvals, and quick views only.

The companion mobile app deliberately does **not** mirror the full web feature set. School admin work is desktop-shaped (reports, billing, roster import/export, license management). The mobile app exists for "I'm not at my desk and I need to approve / glance / get notified."

## Web surfaces (full feature set)
- School dashboard (active learners, license usage, performance overview)
- Roster management (CSV import/export, SIS integrations later)
- Teacher account provisioning
- Class assignment (link teachers to classes, classes to grades)
- License / subscription management (seat allocation, billing, invoices)
- Reports (class performance, attendance, term-on-term progress)
- POPIA / data export tools

## Mobile companion surfaces
- Push notifications (approval requests, weekly digest)
- Approve teacher account requests
- View top-line dashboard metrics
- View report PDFs (download/share)
- Quick announcement to all staff

## Stack
- Web: Next.js (App Router), Tailwind, shared `packages/ui` + `packages/api-client`
- Mobile: Expo, NativeWind, same shared packages

Two builds, one design system. ~85% shared logic, ~50% shared UI (mobile has different layouts).

## Status
Not yet scaffolded. Defer mobile companion until web is shipping reliably.
