# admin

GoMaths Internal Admin — for GoMaths staff (ops, curriculum, support, engineering).

## Platforms

**Web only.** No mobile app. Internal users sit at desks.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Shared `packages/ui`, `packages/api-client`, `packages/auth`
- Auth0 or Firebase Auth (SSO, MFA required for all admin users)

## Surfaces

- User search / impersonation (with audit log)
- Curriculum management (CMS for content team — replaces git-based authoring in Phase 2+)
- AI tutor conversation review (sample-grade for quality)
- AI solver audit (review questionable responses)
- Subscription & billing operations
- POPIA data subject request handling (access / delete / export)
- Feature flag management
- Incident response runbook + on-call console

## Status

Not yet scaffolded. Built incrementally as ops needs arise — no MVP feature list.

## Security

- MFA mandatory
- All actions audit-logged with immutable storage
- Strict role-based access; principle of least privilege
- Internal network or VPN-gated in production
