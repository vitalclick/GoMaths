# GoMaths v2 Launch Plan

**Version:** 0.3 (v2 rebuild)
**Status:** Engineering in progress
**Owner:** TBD (Product Lead)
**Target:** v2 cutover of GoMaths' existing schools, one cohort at a time

> **Context:** GoMaths v1 has been running for 10+ years and serves
> multiple SA schools under MOU today, with apps live in both stores.
> This plan covers the **v2 rebuild** on a clean stack: new tech
> (Expo + NestJS + AI services + SymPy validation), new AWS account,
> new app store listings under the `com.gomaths.mathai*` namespace, and a new database
> with **no migration of v1 data**. Existing schools and learners
> re-onboard onto v2 when each is cut over. v1 continues to run in
> parallel until each school has migrated. See ADR-007 for the
> clean-slate decision.

---

## 1. Hypothesis Being Tested

> v2's AI-tutor-plus-validator gate produces measurably better
> learning outcomes for GoMaths' existing school cohorts than v1, and
> at LLM-spend per learner inside the modelled budget.

Two signals matter:

1. **Educational lift.** v2 vs v1 outcomes inside the same school for
   the same cohort. v1 is the natural control.
2. **Unit economics.** Anthropic prompt-cache hit rate above the
   budgeted ratio (the `/metrics/cache` smoke test). If LLM cost per
   learner exceeds the modelled figure, v2 cannot scale to the full
   v1 footprint without a pricing change.

Everything else — Parent app engagement, Teacher tooling, School Admin
features — is downstream of these two signals.

---

## 2. App Surface (Phase 1)

| App                |    iOS    |  Android  |     Web     | Notes                                        |
| ------------------ | :-------: | :-------: | :---------: | -------------------------------------------- |
| **Student**        |     ✓     |     ✓     |      ✓      | Primary learner surface — full feature set   |
| **Parent**         |     ✓     |     ✓     |      ✓      | Visibility + nudges, billing                 |
| **Teacher**        |     ✓     |     ✓     |      ✓      | Web is primary; mobile is in-class companion |
| **School Admin**   | companion | companion | **primary** | Web-first, lightweight mobile companion      |
| **Internal Admin** |     —     |     —     |      ✓      | GoMaths staff only; built incrementally      |

**Build targets:** 13 deploy targets, **~8 App Store / Play Store listings**.

All consumer apps share one codebase per platform via the monorepo (Expo + React Native Web), with shared `packages/*` for tokens, types, API client, auth, and UI primitives.

---

## 3. Feature Scope (Phase 1)

### Student App

- Auth + grade selection
- CAPS curriculum browser (Grade 9 only at launch — see §4)
- AI Tutor chat (text, English) with SymPy-validated responses
- Scan Solver (printed equations only — handwriting deferred)
- Progress dashboard
- Offline-readable lessons (cached SQLite)

### Parent App

- Linked-child view
- Weekly progress summary + strengths/weaknesses
- Time-on-task chart
- Recent activity feed
- Subscription & billing
- Push notifications (streak, weekly digest)
- Read-only AI tutor transcripts (POPIA-compliant)

### Teacher App

- Class roster
- Per-student progress
- Assignment creation (from curriculum bank + AI drafts)
- Assignment grading + feedback
- Classroom analytics
- Announcements to learners
- Lesson preview

### School Admin (web primary, mobile companion)

**Web:** Dashboard, roster import/export, teacher provisioning, class management, license/seat allocation, billing, reports, POPIA data tools
**Mobile:** Push notifications, approval queue, top-line metrics view, report PDF access, staff announcements

### Internal Admin (web only)

User search, curriculum CMS (replaces git-based authoring at Phase 2 scale), AI conversation/response review, billing ops, POPIA DSR handling, feature flags

---

## 4. Curriculum Scope at Launch

**Grade 9 (Senior Phase) only.** All other grades deferred.

This is non-negotiable for the pilot. Rationale:

- Transition year — highest impact for intervention
- Tractable content volume (~19 topics)
- Highly motivated parents
- Allows the educational hypothesis to be tested cleanly

See `Curriculum_Content_Plan.md` for the content authoring plan, which is unchanged by the broader app surface decision (content effort is grade-bound, not app-bound).

Grades 8 and 10 follow in Phase 2.

---

## 5. Out of Scope (Phase 1, Across All Apps)

- Adaptive learning / recommendation engine → Phase 2
- Gamification beyond basic XP/streak → Phase 2
- Multilingual (Afrikaans, isiZulu, Sesotho, Xhosa) → Phase 2
- Voice tutor → Phase 3
- Handwriting OCR → Phase 3
- Desmos-style graphing engine → Phase 3
- RPG / multiplayer → Phase 4
- WhatsApp integration → Phase 2
- Payments / subscriptions at scale (Phase 1 is pilot-free; billing wired but not promoted) → Phase 2 commercial launch
- **Human Tutor Marketplace (Tutor app + booking/payments/video)** → Phase 1.5, gated on Phase 1 pilot signal. See `Tutor_Marketplace_Plan.md`.

---

## 6. Non-Functional Requirements

### Mobile (iOS + Android, all consumer apps)

| Area            | Requirement                                          |
| --------------- | ---------------------------------------------------- |
| Android minimum | 8.0 (API 26)                                         |
| iOS minimum     | 14                                                   |
| Target device   | Entry-level Android (2GB RAM, e.g. Samsung A-series) |
| App size        | < 70 MB initial download per app                     |
| Cold-start      | < 3s on target device                                |
| Network         | Works on 3G; lessons readable offline                |

### Web

| Area               | Requirement                                         |
| ------------------ | --------------------------------------------------- |
| Browser support    | Latest 2 versions of Chrome, Edge, Safari, Firefox  |
| Mobile browsers    | iOS Safari 14+, Chrome Android (latest 2)           |
| ChromeOS           | **First-class target** (SA school computers)        |
| Initial JS payload | < 250 KB gzipped for student app                    |
| Lighthouse         | ≥ 90 performance, ≥ 95 accessibility on student app |

### Everywhere

| Area                | Requirement                                                                         |
| ------------------- | ----------------------------------------------------------------------------------- |
| Data residency      | AWS af-south-1 (POPIA)                                                              |
| AI tutor latency    | < 5s p50, < 12s p95                                                                 |
| AI solver latency   | < 8s p95                                                                            |
| Crash-free sessions | ≥ 99%                                                                               |
| Accessibility       | WCAG 2.1 AA on web; equivalent on mobile (dynamic type, screen reader, focus order) |

---

## 7. Success Metrics (Pilot — 12 weeks after launch)

### Technical

- Crash-free session rate ≥ 99% (per app)
- Solver accuracy on supported topics ≥ 92% (manually graded sample of 500)
- Tutor factual accuracy ≥ 95% (manually graded sample of 300)
- Web Lighthouse score targets met

### Engagement

- Student app DAU/MAU ≥ 35% in pilot cohort
- ≥ 60% of registered students complete ≥ 5 practice sessions
- Parent app MAU ≥ 40% of linked parent accounts
- Teacher app weekly active ≥ 70% of pilot teachers

### Educational (the real test — unchanged from earlier MVP draft)

- Pilot students show **≥ 8 percentage point** improvement on a standardised CAPS Grade 9 assessment vs. a matched control group over the 12-week pilot.

**If the educational metric fails, do not invest in Phase 2 expansion until the learning loop is fixed.** Four polished apps with no learning outcome is a worse position than one rough app with a proven outcome.

---

## 8. Team & Timeline

### Team

This is the team v2 needs to ship and onboard the first cutover
school. Anything already covered by the v1 organisation doesn't need
to be re-hired — count what's missing, not the full list. Roles
marked **(net new)** are the ones the v1 team is least likely to
already have for a rebuild of this shape.

| Role                           | Count | Notes                                                                                  |
| ------------------------------ | ----- | -------------------------------------------------------------------------------------- |
| Product Manager                | 1     | Owns the v1→v2 cutover plan per school.                                                |
| EdTech / Pedagogy Specialist   | 1     | Validates the v2 learning loop against v1 outcomes.                                    |
| Product Designer               | 1–2   | Brand carries over; needed for v2-specific UI work.                                    |
| Expo / RN Engineers            | 2–3   | One senior owning `packages/ui` + cross-cutting; the rest building app features.       |
| Next.js Engineer **(net new)** | 1     | School Admin + Internal Admin web.                                                     |
| Backend Engineer (NestJS)      | 1–2   |                                                                                        |
| AI Engineer (Python / FastAPI) | 1     | Owns the validator + tutor + solver services and the prompt-cache observability story. |
| DevOps Engineer **(net new)**  | 1     | New AWS account, Fargate per ADR-007, EAS for the new bundle IDs.                      |
| QA Engineer                    | 1–2   | Cross-platform matrix.                                                                 |
| Curriculum Specialists         | 1–2   | SACE-registered. Sized to the conversion-vs-re-authoring decision.                     |
| Curriculum Editor              | 0.5   | Part-time; final quality pass.                                                         |
| Information Officer (POPIA)    | —     | Likely already exists at v1; signs off the DPIA delta for v2.                          |

### Timeline (indicative)

Faster than a greenfield build because the v1 organisation, brand,
schools, and app store accounts already exist. The biggest unknown is
how much curriculum content lands in week 1 vs week 12.

| Phase                       | Weeks | What ships                                                                                                                          |
| --------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation              | done  | Monorepo + design tokens + backend + AI services + Student app + Parent dashboard + Terraform modules + preview deploy scaffolding. |
| 1 — Live preview            | 1–2   | Operator runs the Fly.io preview runbook; real Anthropic key in tutor; `/metrics/cache` verified `> 0`; MathPix wired.              |
| 2 — Curriculum conversion   | 1–8   | Conversion strategy chosen (programmatic / re-author / hybrid); enough Grade-9 content in the new format for one school.            |
| 3 — AWS production          | 2–6   | New AWS account bootstrapped; Terraform modules applied + Fargate module added; backend + AI services deployed in af-south-1.       |
| 4 — Teacher + School Admin  | 4–10  | Teacher-scoped backend endpoints; Teacher app fleshed out; School Admin web (Next.js) built.                                        |
| 5 — App store re-submission | 6–10  | New bundle IDs reviewed under same developer accounts; kid-app policies; EAS Update channels for v2.                                |
| 6 — Hardening               | 8–12  | Accessibility audit, security review, POPIA DPIA delta signed off, first-school cutover plan finalised.                             |
| 7 — First-school cutover    | 12+   | One existing school re-onboarded onto v2; pre-/post-assessment vs v1 cohort.                                                        |

### Critical path

**Curriculum content** (19 lessons × full QA workflow) is still the critical path — content doesn't scale with app count. See `Curriculum_Content_Plan.md`.

---

## 9. Budget Envelope (Indicative, ZAR)

The numbers below are **incremental v2-rebuild cost** on top of the
existing operating budget for v1. Lines that are already funded as
part of running v1 (e.g. core engineering salaries that are simply
redirected onto v2) shouldn't be double-counted here — but every
finance team frames this differently, so treat this as a planning
template, not a quote. The right exercise is to sit down with finance
and split each line into "already in the v1 run-rate" vs "new for v2."

| Line item                                                                 | Low       | High      | Notes                                                                                            |
| ------------------------------------------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------ |
| Net new engineering (delta over v1 team's current capacity, 6–9 months)   | R 2.0M    | R 4.0M    | Sized to whatever's missing from your current v1 engineering — adjust to fit.                    |
| Design (UI/UX work specific to v2)                                        | R 0.4M    | R 0.8M    | Smaller than greenfield because the design system + brand carry over.                            |
| Curriculum format conversion (v1 content → new SymPy-validatable shape)   | R 0.3M    | R 0.6M    | Lower bound assumes mostly programmatic conversion; upper bound assumes specialist re-authoring. |
| AI API costs during rebuild + first-school cohort                         | R 0.1M    | R 0.2M    | Anthropic Haiku 4.5 with prompt caching; verify ratio before signing this number off.            |
| MathPix OCR (contract + usage)                                            | R 0.05M   | R 0.1M    |                                                                                                  |
| AWS af-south-1 infra (new account, runs in parallel with v1 for a window) | R 0.15M   | R 0.3M    | Fargate + RDS + ElastiCache + S3 + CloudFront, sized for the first cutover cohort.               |
| Auth0 / Sentry / monitoring / tooling SaaS                                | R 0.1M    | R 0.2M    |                                                                                                  |
| New app store listings (review fees + kid-app policy submissions)         | R 0.03M   | R 0.06M   | Same developer accounts as v1, new bundle IDs.                                                   |
| Legal (POPIA DPIA **delta** for new AI processing, updated ToS for v2)    | R 0.1M    | R 0.2M    | Lower than greenfield because v1 already has the base DPIA and ToS templates.                    |
| Contingency (15%)                                                         | R 0.5M    | R 1.0M    |                                                                                                  |
| **Total incremental v2-rebuild cost**                                     | **~R 4M** | **~R 8M** | Excludes v1 operating cost. The wide range is mostly the curriculum-conversion question.         |

The biggest cost variable is the curriculum-conversion strategy (see
ADR-007 + the "Decisions" section below). If most v1 topics can be
converted programmatically into the SymPy-validatable shape, the
content line stays small. If they need to be re-authored from scratch
by SACE specialists, it grows.

---

## 10. Key Risks (v2 Rebuild)

| Risk                                                                    | Severity     | Mitigation                                                                                                                                                                |
| ----------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v2's educational lift vs v1 is statistically indistinguishable          | **Critical** | Instrument outcomes from the first cutover. Pre-/post-assessment for the first school, with v1 cohorts as the natural control. Don't promote v2 wider until lift is real. |
| Anthropic prompt-cache assumption fails in production                   | **Critical** | `/metrics/cache` smoke test on every deploy; alert if `cache_hit_ratio < 0.5` for >1h. **Verify before quoting any per-learner cost to a school.**                        |
| AI tutor produces wrong maths                                           | High         | SymPy validation layer is the moat. CI runs the validator on every authored answer; human spot-check on a sampled %.                                                      |
| New app store listings rejected (kid-app policies under new bundle IDs) | Medium       | Re-use the v1 policy artefacts where possible; engage Apple/Google compliance reviewers before submission, not after.                                                     |
| Curriculum conversion slips                                             | High         | Size the conversion strategy in week 1 (programmatic vs re-author). Don't ship v2 to a school until the conversion is done for that school's grade.                       |
| v1 → v2 cutover plan is missing for the chosen first school             | High         | Block onboarding until the written cutover plan exists (comms, parallel-running window, v1 sunset).                                                                       |
| Cross-platform regressions in the new stack                             | Medium       | E2E test matrix per app (iOS sim + Android emu + Chrome) in CI. Today: web only; add iOS + Android once EAS is wired.                                                     |
| Budget overrun on the curriculum line                                   | High         | Gating decision at week 4: programmatic conversion proven, OR re-authoring rate confirmed against curriculum specialist throughput.                                       |

---

## 11. Decisions Required Before First School Cutover

1. **Grade band for first v2 cutover:** Grade 9 by default (only grade
   with new-format curriculum content today); confirm with the chosen
   school.
2. **First cutover school:** pick from the existing v1 MOU list — the
   one most willing to be a v2 early adopter.
3. **Curriculum format-conversion strategy:** v1's existing content →
   the new SymPy-validatable shape. Convert programmatically, re-
   author with SACE specialists, or hybrid? Sizing this decision is
   the gating item on rollout scope.
4. **AI provider as production default:** Anthropic Haiku 4.5 by
   default; verify cache hit rate on the live `/metrics/cache`
   endpoint before committing to the cost model.
5. **Hosting region:** AWS af-south-1 confirmed (POPIA defensibility).
6. **Compute layer:** ECS Fargate per ADR-007 (not EKS).
7. **Auth provider:** Auth0 (recommended for school SSO) vs Firebase
   vs self-hosted. ADR-005 still open.
8. **v1 → v2 cutover plan per school:** comms, onboarding session,
   parallel-running window, v1 sunset date. Product/ops decision.

---

## 12. Definition of Done (v2 first-school cutover)

v2 is ready to cut over the first school when:

- All four core apps (Student, Parent, Teacher, School Admin) shipped
  to their target platforms with feature scope met for that school's
  needs (which may be narrower than the full plan above).
- New app store listings live under the `com.gomaths.mathai*` namespace (student: `com.gomaths.mathai`; parent / teacher use `.parent` / `.teacher` suffixes).
- Cutover plan signed off with the chosen school: onboarding session
  scheduled, learner-comms drafted, support coverage for the first
  two weeks staffed.
- Pre-assessment administered to the cohort so the v2-vs-v1 outcomes
  comparison has a baseline.
- Monitoring live (Sentry + CloudWatch + the tutor `/metrics/cache`
  endpoint dashboarded).
- Incident response runbook exists and has been tabletop-tested
  against the v2 stack (not the v1 one).
- POPIA DPIA **delta** for the new AI processing signed off by the
  Information Officer.
- Accessibility audit (WCAG 2.1 AA) passed on Student app + web
  School portal.
- Curriculum content for the chosen grade frozen and through the full
  SymPy-validated QA pipeline.
