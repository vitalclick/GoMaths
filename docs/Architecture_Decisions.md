# Architecture Decisions

A running log of significant architectural decisions for GoMaths. Each entry captures: what was decided, when, why, and what alternatives were considered.

---

## ADR-001 — Multi-platform strategy: Expo for consumer apps, Next.js for internal admin

**Date:** 2026-05-15
**Status:** Accepted

### Decision
- **Consumer apps** (Student, Parent, Teacher, School companion) → **Expo + React Native Web** — single codebase per app shipping to iOS, Android, and Web.
- **Web-primary surfaces** (School Admin web portal, Internal Admin) → **Next.js** for the heavier desktop-shaped workflows.
- All apps live in a single **pnpm + Turborepo monorepo** with shared `packages/*` for tokens, types, API client, UI primitives, and auth.

### Why
- Four consumer apps × three platforms = ~85% shared code via Expo; building separately would be 2–3× the engineering cost
- Design2 mockups use Tailwind v4 — NativeWind maps these classes directly into RN, preserving the visual spec
- School admin and internal admin do desktop-shaped work (reports, billing, CMS) — a web-native stack serves them better than a cross-platform UI

### Alternatives considered
- **Option A: Expo + Expo Web for everything.** Rejected — admin/school portals suffer in a mobile-shaped UI framework.
- **Option B: React Native (mobile) + Next.js (web) separate.** Rejected — duplicates student app UI work without enough benefit.
- **All-native (Swift + Kotlin + React web).** Rejected — too expensive for an early-stage product, no shared engineering team across stacks.

### Implications
- App store maintenance: 8 listings (4 consumer app pairs)
- Single design system shared across 5 apps via `packages/ui` + `packages/design-tokens`
- React Native Web caveats around layout, scroll, and a11y need testing on ChromeOS specifically

---

## ADR-002 — Hosting region: AWS af-south-1 (Cape Town)

**Date:** 2026-05-15
**Status:** Accepted

### Decision
All GoMaths services and PII storage in **AWS af-south-1**.

### Why
- POPIA places strong expectations on data residency for SA personal information; af-south-1 is the defensible choice
- Latency to SA learners is materially better than eu-west or us-east
- B2B (schools, departments) will ask about residency in procurement — having a clear answer is a sales asset

### Alternatives considered
- **eu-west-1 with SA CloudFront edge.** Lower direct cost, but weaker POPIA story and slower TTFB for database-backed requests.
- **Local SA cloud (e.g. Teraco-hosted).** Smaller surface, weaker managed-services ecosystem.

---

## ADR-003 — Cross-platform styling: NativeWind

**Date:** 2026-05-15
**Status:** Recommended (pending team sign-off)

### Decision
Adopt **NativeWind** (Tailwind for React Native) as the styling layer for all Expo apps.

### Why
- The accepted design (UI/design2) is authored in Tailwind v4 — NativeWind keeps the same class names usable on native
- Familiar mental model for any front-end engineer
- Composes well with `packages/design-tokens` exporting Tailwind theme

### Alternatives considered
- **Tamagui.** Powerful theming + animation, but heavier learning curve and more opinionated. Reconsider if we hit perf issues with NativeWind.
- **StyleSheet + hand-rolled tokens.** Maximum flexibility, lowest velocity. Rejected.

---

## ADR-004 — Mascot, palette, typography lock-in (from design review)

**Date:** 2026-05-15
**Status:** Recommended (pending designer sign-off)

### Decision
- **Mascot name:** Maya (design2 naming)
- **Palette:** design2's GoMaths green + warm red accent + neutral surfaces (oklch tokens in `packages/design-tokens`)
- **Type:** Sora (display) + Inter (body) + JetBrains Mono (math)

### Why
Both design submissions converged on these traits except for naming inconsistencies. Locking these enables the design system to ship in Phase 0 without further bikeshedding.

### Open
- Variant palettes from design1 (`vivid`, `aiBlue`) are useful for marketing demos but not shipped as product themes in Phase 1.

---

## ADR-005 — Authentication provider: TBD (leaning Auth0)

**Date:** 2026-05-15
**Status:** Proposed

### Decision (proposed)
Use **Auth0** as the identity provider for Phase 1.

### Why (if accepted)
- SAML/OIDC for school B2B SSO requirements (likely in early B2B contracts)
- Mature MFA, audit logging, POPIA-defensible data handling
- Good Expo support; SDKs across all our platforms

### Alternatives
- **Firebase Auth.** Cheaper, weaker enterprise SSO story
- **Self-hosted JWT in NestJS.** Full control, significant build cost; reconsider once we hit Auth0 pricing pain

### Decision blocker
Cost modelling against expected DAU + B2B SSO requirements not yet done. Decision target: Phase 0 week 2.
