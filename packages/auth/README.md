# @gomaths/auth

Shared authentication primitives across all apps.

## What lives here

- Sign-up / sign-in / refresh flows (hooks)
- Token storage (SecureStore on native, secure cookies on web)
- POPIA-compliant parental consent flow (under-18 sign-up)
- MFA challenge UI for admin app

## Decision: provider

TBD. Candidates:

- **Auth0** — robust, expensive, easy compliance story
- **Firebase Auth** — cheap, well-supported in Expo, weaker enterprise SSO
- **Self-hosted (NestJS + JWT)** — full control, more work

Recommend Auth0 for Phase 1 due to POPIA defensibility + school SSO requirements (SAML/OIDC for B2B contracts).
