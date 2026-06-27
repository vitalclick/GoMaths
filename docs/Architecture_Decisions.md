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
**Status:** Partially superseded by ADR-008 (typography + design-language
direction now follow design1; palette stands).

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

---

## ADR-006 — Human tutoring: separate marketplace product, gated on Phase 1

**Date:** 2026-05-15
**Status:** Accepted (Phase 1.5)

### Decision

Build a **Tutor Marketplace** as a distinct phase (Phase 1.5) after Phase 1 ships. It consists of:

- A new **Tutor app** (`apps/tutor/`, Expo, iOS+Android+Web) for tutors managing their profile, availability, sessions, earnings.
- New **marketplace surfaces inside the existing Parent and Student apps** for discovery, booking, joining, and rating sessions.
- New **trust & safety surfaces inside the Internal Admin app** for vetting, dispute resolution, and payouts.

Phase 1.5 is **gated** on Phase 1 pilot showing ≥ 6pp improvement on the Grade 9 CAPS assessment. If the gate is missed, Phase 1.5 does not ship.

### Why a separate phase

- Marketplace amplifies whatever the core product does. If the core product doesn't move learner outcomes, the marketplace amplifies nothing.
- Marketplaces have their own compliance regime (child safety, payments, tax) that needs dedicated legal/tax work
- Building before pilot signal risks ~R 4.4–7M with no validated demand

### Why NOT fold tutoring into the Teacher app

- Teachers = SACE-registered, school-affiliated, B2B sale, salary from school
- Tutors = independent contractors, B2C marketplace, paid per session through GoMaths
- Different identity, vetting, payments, compliance, support — different products
- Mixing them creates child-safety policy ambiguity (school's policy doesn't extend to a teacher's private after-hours work)

### Alternatives considered

- **"Escalate to human" inside AI tutor only** (no full marketplace). Smaller scope, but doesn't capture marketplace economics. Reconsider as a Phase 1.5 launch feature inside the marketplace, not as a replacement for it.
- **No tutor product at all.** Defensible but cedes a large SA opportunity to whatever competitor moves first.
- **Tutor app added in Phase 1.** Rejected — compounds Phase 1 scope and ships marketplace before learning hypothesis is validated.

### Implications

- Repo: `apps/tutor/` scaffolded as a stub now; full build starts Month 10
- Five consumer apps in the eventual product surface (Student / Parent / Teacher / **Tutor** / School)
- Compliance build-out: police clearance integration, Form 30 (Children's Act), session recording + POPIA retention, FSCA-aware payments via a facilitator, tax/IRP6 handling
- Operations build-out: trust & safety team (vetting + disputes), payouts ops
- See `docs/Tutor_Marketplace_Plan.md` for full plan.

---

## ADR-007 — v2 rebuild on a clean stack; preview on Fly, prod on AWS af-south-1 with ECS Fargate

**Status:** Accepted
**Date:** 2026-05

### Context

GoMaths v1 has been running for 10+ years and serves multiple SA
schools under MOU today. The product owner has chosen to **rebuild on
a new tech stack** (Expo + NestJS + AI services + SymPy validation)
rather than refactor v1 in place. The rebuild needs three things this
ADR pins down:

1. A clean separation from v1 — so v1 keeps running undisturbed while
   v2 is built and rolled out, school by school.
2. A way to put v2 in front of internal stakeholders before AWS
   production is provisioned.
3. A production landing zone that's POPIA-defensible at the regulator
   level and operable by a small team.

### Decision

**Clean slate. No migration of v1 data, infrastructure, or store
listings.**

- **Bundle IDs:** new under the `com.gomaths.mathai*` namespace —
  student app is `com.gomaths.mathai`; parent and teacher use the
  `.parent` / `.teacher` suffixes. v2 ships as separate apps in both
  stores; v1 stays installed on existing devices until each school
  cuts over.
- **AWS account:** new account, separate from anything v1 uses. Same
  region (`af-south-1`) per ADR-002.
- **Database:** new Postgres. No v1 data is imported. Schools and
  learners re-onboard onto v2 when they cut over.
- **Preview hosting (now, days):** Fly.io `jnb` region. Backend +
  three AI services as Docker apps, Postgres + Redis as Fly
  primitives, Student web SPA on Cloudflare Pages. Runbook at
  `infrastructure/preview/README.md`. **Internal/stakeholder demo
  only — not a school-facing surface.**
- **Production hosting (v2 cutover onwards):** AWS af-south-1 using
  the Terraform modules already in `infrastructure/terraform/modules/`
  (network/database/cache/storage/secrets) **plus** a Fargate module
  for compute. **NOT EKS.** At rebuild scale (initially one school's
  cohort, scaling to the v1 footprint over time) the K8s
  ops burden is not justified — Fargate gives us the same VPC
  attachment, IAM roles, ALB integration, and auto-scaling at a
  fraction of the operational complexity.

### Why Fargate, not EKS

- v1's school footprint is large but each school's load profile is
  bounded — this is not a cardinality problem K8s solves.
- EKS adds ~$73/mo control plane, ALB+NAT, and meaningful weekly
  ops burden (cluster upgrades, addon compatibility, IRSA hygiene)
  that doesn't pay off until ~20+ services or multi-team platform
  ownership.
- Fargate's per-task billing aligns with the workload: backend
  always-on, AI tutor + solver scale-to-zero overnight in dev/
  staging.
- Migration to EKS later is feasible if the load profile changes.

### Why Fly.io for preview

- Native Docker, `jnb` region (Johannesburg) keeps latency real for
  SA stakeholder demos.
- Postgres + Redis as first-party primitives — no extra accounts to
  manage for a temporary preview environment.
- ~$5–15/month at preview scale; destroy when not in use.
- Compliance posture is fine for an internal demo with synthetic
  data; not appropriate for real learners or POPIA-scoped data,
  which is why the preview banner explicitly forbids real personal
  data.

### Alternatives considered

- **In-place upgrade of v1.** Rejected — the new validator gate,
  streaming tutor, and CAPS-aligned curriculum format are
  architecturally different enough that incremental refactor would
  cost more than a clean rebuild and ship slower.
- **Keep v1 bundle IDs, ship v2 as an in-place update.** Rejected —
  forces every v1 user onto v2 the day Apple/Google reviews complete,
  with no rollback. Separate listings let each school cut over on
  their own schedule.
- **AWS App Runner instead of Fargate.** Rejected — too constrained
  on VPC attachment and concurrency for the SSE-streaming tutor.
- **Render or Railway for preview instead of Fly.** Both viable.
  Fly chosen for the `jnb` region (no SA region on either
  competitor today) and Docker-native multi-service deploys.

### Implications

- Operator must bootstrap a fresh AWS account for v2 (S3 + DynamoDB
  for tfstate; see `infrastructure/README.md`).
- Apple Developer + Google Play accounts may already exist for v1;
  v2 ships under the same developer accounts but new bundle IDs.
- EAS Build + EAS Update channels for v2 should be separate from any
  v1 channels — `gomaths-v2-*` slug naming convention.
- v1 → v2 cutover per school is a product/ops decision, not
  engineering. Engineering must NOT ship v2 to a school without a
  written cutover plan (comms, onboarding session, parallel-running
  window, v1 sunset date).
- The `ecs` Terraform module is the next infra deliverable. It
  doesn't exist yet — the trigger to write it is "first signed v2
  cutover date for a school."

---

## ADR-008 — design1 is the canonical student-app design language

**Date:** 2026-06-27
**Status:** Accepted (reflects what shipped; supersedes ADR-004's
typography + mascot lean)

### Context

ADR-004 leaned toward design2 for mascot naming and typography (Sora +
Inter), but it was never signed off, and the product drifted: the
first-launch onboarding flow shipped against **design1** ("redesign to
match UI/design1 language"), with design1's Maxi mascot, page-dot
pattern, and rounded Nunito-style type. Meanwhile `packages/design-tokens`
was derived from design2 (oklch → hex), with Sora/Inter font tokens that
nothing actually loads — every screen falls back to the system font today.

The result was an inconsistent foundation: one shipped flow in design1,
shared tokens pointing at design2, and the rest of the student app on an
older plain component style. This ADR resolves the design1-vs-design2
question so the rest of the app can be built against one system.

### Decision

- **design1 is canonical for the student app's visual language** —
  component shapes, the Maxi mascot, gamification surfaces (XP / streak /
  daily goal), and the floating bottom tab bar.
- **Typography:** a single rounded family — **Nunito** — for display and
  body, with JetBrains Mono for maths. Supersedes ADR-004's Sora + Inter.
- **Palette:** unchanged. The design2-derived hex palette in
  `packages/design-tokens` already matches design1 (same GoMaths green
  `#008a3e`, warm red `#ea3c3f`) and keeps `streak`/`xp` tokens. ADR-004's
  palette stands; only an **`ai` purple** token is added (design1's AI /
  tutor distinction), which design2 lacked.
- **Shared primitives live in `@gomaths/ui`**, not copy-pasted per screen
  (the onboarding flow inlined its own Maxi; that is the anti-pattern this
  decision exists to stop).

### Why

- Don't fight reality: the only shipped polished flow is already design1.
- One rounded family (Nunito) matches design1's playful, learner-facing
  tone better than the more neutral Sora/Inter pairing.
- Centralising primitives is the precondition for re-skinning Home and the
  rest of the app without duplication.

### Open / follow-ups

- **Mascot vs tutor naming.** design1's mascot is **Maxi**; the AI tutor
  persona in the app + backend is **Maya**. Shipping both is confusing.
  This is a product/copy decision, intentionally NOT resolved here — no
  rename has been made. The shared mascot component keeps design1's name
  (`Maxi`) until product decides.
- **Font bundling.** Nunito is not yet bundled. Until an app registers it
  via `expo-font` (e.g. `@expo-google-fonts/nunito`), the family token
  falls back to the system font — no regression, but design1's look isn't
  fully realised until the font ships. Requires a dependency add + verified
  install (CI uses a frozen lockfile).
- **GMIcon.** design1's ~25-glyph stroke icon set needs `react-native-svg`
  (not currently a dependency). Deferred to the same dependency-add pass;
  the shared primitives are icon-agnostic (accept a node) so they don't
  block on it.
- **expo-linear-gradient** for design1's gradient AI buttons / hero cards
  is likewise not installed; the `ai` Button variant ships as a solid fill
  for now.
