# GoMaths v2 Launch Plan

**Version:** 0.3 (v2 rebuild)
**Status:** Engineering in progress
**Owner:** TBD (Product Lead)
**Target:** v2 cutover of GoMaths' existing schools, one cohort at a time

> **Context:** GoMaths v1 has been running for 10+ years and serves
> multiple SA schools under MOU today, with apps live in both stores.
> This plan covers the **v2 rebuild** on a clean stack: new tech
> (Expo + NestJS + AI services + SymPy validation), new AWS account,
> new app store listings (`co.za.gomaths.v2.*`), and a new database
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

### Team (~16–17 FTE for the duration)

| Role                           | Count | Notes                                                                 |
| ------------------------------ | ----- | --------------------------------------------------------------------- |
| Product Manager                | 1     |                                                                       |
| EdTech / Pedagogy Specialist   | 1     |                                                                       |
| Product Designer               | 2     | One mobile-leaning, one web-leaning                                   |
| Expo / RN Engineers            | 5     | 2 senior (own `packages/ui` + cross-cutting); 3 building app features |
| Next.js Engineer               | 1     | Web admin + school portal web                                         |
| Backend Engineer (NestJS)      | 2     |                                                                       |
| AI Engineer (Python / FastAPI) | 1.5   | Solver + Tutor + validation                                           |
| DevOps Engineer                | 1     | EAS, AWS af-south-1, CI/CD                                            |
| QA Engineer                    | 2     | Cross-platform matrix is large                                        |
| Curriculum Specialists         | 2     | SACE-registered, Grade 9 maths                                        |
| Curriculum Editor              | 0.5   | Part-time, weeks 8–32                                                 |

### Timeline (9–12 months to pilot launch)

| Phase                 | Weeks | What ships                                                                                                           |
| --------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation        | 1–4   | Monorepo, design tokens, packages scaffolded, infra in af-south-1, design system locked, content templates finalised |
| 1 — Core student loop | 5–16  | Student app on iOS+Android+Web with auth, curriculum browse, lesson view, basic quiz, progress                       |
| 2 — AI services       | 12–22 | Tutor + Solver behind validation layer, integrated into student app                                                  |
| 3 — Parent + Teacher  | 16–32 | Both apps shipped on iOS+Android+Web                                                                                 |
| 4 — School portal     | 24–36 | Web primary + mobile companion                                                                                       |
| 5 — Hardening         | 36–44 | App store submissions, accessibility audit, security review, POPIA DPIA, content freeze                              |
| 6 — Closed beta       | 44–48 | 1 pilot school, ~30 students                                                                                         |
| 7 — Pilot launch      | 48+   | 4 schools, 12-week measurement period                                                                                |

### Critical path

**Curriculum content** (19 lessons × full QA workflow) is still the critical path — content doesn't scale with app count. See `Curriculum_Content_Plan.md`.

---

## 9. Budget Envelope (Indicative, ZAR)

| Line item                                                        | Low          | High         |
| ---------------------------------------------------------------- | ------------ | ------------ |
| Engineering (16 FTE × 10 months avg, mixed seniority)            | R 7.5M       | R 11M        |
| Design (2 FTE × 10 months)                                       | R 1.6M       | R 2.4M       |
| Curriculum content (2 specialists + 0.5 editor, 6 months)        | R 350K       | R 520K       |
| AI API costs (pilot scale, multi-app)                            | R 80K        | R 150K       |
| MathPix OCR                                                      | R 50K        | R 100K       |
| Cloud infra (AWS af-south-1, multi-app)                          | R 150K       | R 280K       |
| Auth0 / monitoring / tooling SaaS                                | R 100K       | R 180K       |
| App Store + Play Store fees, kid-app reviews                     | R 30K        | R 60K        |
| Legal (POPIA DPIA, B2B contracts, ToS x4 apps, kid-app policies) | R 150K       | R 280K       |
| Contingency (15%)                                                | R 1.5M       | R 2.3M       |
| **Total**                                                        | **~R 11.5M** | **~R 17.3M** |

This is a **5–7× increase** over the original mobile-only MVP envelope. The increase is driven by:

- 4× app count (not 4× cost due to shared packages — but ~2.5× engineering)
- Web platform added (responsive layouts, browser matrix, ChromeOS testing)
- Larger ongoing app store / compliance surface
- Larger design effort (4 personas, 3 platforms each)

This is venture-scale. Plan funding accordingly (seed-to-Series-A range).

---

## 10. Key Risks (Phase 1)

| Risk                                               | Severity     | Mitigation                                                                                                                               |
| -------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Educational hypothesis fails after building 4 apps | **Critical** | Instrument outcomes from day 1. Run a 30-student closed beta at week 44 _before_ the 4-school pilot to catch learning-loop issues early. |
| AI tutor produces wrong maths                      | High         | SymPy validation layer + human spot-check + curriculum-grounded prompts                                                                  |
| Scope creep across 4 apps                          | High         | Strict feature-locking per app at week 4; PM owns scope discipline ruthlessly                                                            |
| App store rejections (kid-app policies)            | Medium       | Engage Apple/Google compliance reviewers by week 8; don't wait until submission                                                          |
| Curriculum content slips (still critical path)     | High         | Specialists hired week –4; weekly throughput tracked                                                                                     |
| Cross-platform regressions                         | Medium       | E2E test matrix per app (iOS sim + Android emu + Chrome + ChromeOS) in CI                                                                |
| Team coordination overhead at 17 FTE               | Medium       | Clear app ownership per pod; weekly cross-pod sync only                                                                                  |
| Budget overrun                                     | High         | Quarterly burn review; explicit gating decisions at month 4, 7, 10                                                                       |

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
- New app store listings live under `co.za.gomaths.v2.*`.
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
