# GoMaths v2 — Handoff

You're picking up a **v2 rebuild** of GoMaths. The v1 product has been
running for 10+ years, is live in both app stores under
`co.za.gomaths.*`, has MOUs with South African schools, and continues
to serve learners while this rebuild ships. v2 is a clean-slate
replacement on a new tech stack with new bundle IDs under the
`com.gomaths.mathai*` namespace, a new AWS account, and a new database — **no
data or user migration** from v1. Existing schools and learners
re-onboard onto v2 when it's ready.

Read time: ~15 minutes. Suggested reading order at the bottom — but
start here.

---

## TL;DR

- **What this is**: a clean-slate rebuild of GoMaths — an AI-powered, CAPS-aligned Grade R–12 maths app for South African learners. The new differentiator: an LLM tutor whose maths claims are verified by SymPy before reaching the learner.
- **State**: code runs end-to-end. `pnpm-lock.yaml` is committed, the API client codegen output is real, CI runs the full typecheck + lint + format + E2E matrix on every PR. 31 backend tests, 44 Python tests, all green.
- **What's been built**: NestJS backend (auth + refresh rotation + real parental-consent flow + curriculum + progress + streaming tutor + scan solver + notifications + scheduler + throttling + parents), three FastAPI services (SymPy validator, tutor with cache metrics, solver), Student Expo app (full happy path), Parent Expo app (dashboard with linked children), Teacher Expo app (skeleton — boots + login), Prisma schema + 4 migrations, OpenAPI spec, Terraform modules for AWS af-south-1 (VPC + RDS + ElastiCache + S3 + Secrets), Fly.io preview-deploy scaffolding (Dockerfiles + fly.tomls).
- **What's NOT done**: real production deploy (the Fly.io preview scaffolding is wired, but no one has run `fly deploy` yet); curriculum content is 2 topics in the new SymPy-validatable format; MathPix OCR is mocked; the Teacher app is a skeleton; v1→v2 cutover plan for schools is a product decision, not engineered yet.
- **The most important thing to keep**: the validator gate. Every authored answer, every tutor reply that contains a maths claim, is checked by SymPy. That's the moat.

---

## State of the work

Honest snapshot. Trust this list over any individual file's optimism.

### Working (in CI, on every PR)

- **SymPy validator** — `services/ai-services/validation/`. 16 tests pass.
  Handles equation-solving and expression-simplification shapes.
  Conservative: returns `NOT_VERIFIED` rather than guessing.
- **Curriculum validator pipeline** — `curriculum-data/scripts/validate_curriculum.py`
  walks every authored topic, checks every answer through SymPy. Wired
  into CI. 2 Grade 9 algebra topics, 7 questions, 0 failed.
- **AI services unit tests** — 44 pytest specs (validator + tutor +
  solver + claim extractor + curriculum loader + cache-metrics aggregator).
- **Backend unit tests** — 31 jest specs (auth + refresh rotation +
  parental-consent state machine + leader lock with Lua CAS + streak
  reminder + tutor + conversations + progress + notifications).
- **LLM provider abstraction** — Anthropic + OpenAI + Mock. Tests use
  monkeypatched SDKs so no real API key is needed in CI. Real keys
  switch the providers via `TUTOR_PROVIDER` env.
- **Full Node CI matrix** — install (frozen) + Prisma generate +
  OpenAPI codegen drift check + typecheck + format + lint + Playwright
  E2E. The four `if: ${{ false }}` guards from the early-scaffold era
  are all gone.

### Built end-to-end but unverified against real services

- **NestJS backend** — auth (self-hosted JWT + refresh rotation +
  Prisma-backed sessions with reuse detection), real **parental-consent
  flow** (request → email invite via Resend or log-only fallback →
  confirm → poll → one-time receipt → consume on register; server-side
  `birthYear` derivation of minor status), curriculum (filesystem-loaded
  from `curriculum-data/`), progress, tutor (SSE streaming + history),
  solver (multipart upload), notifications (Expo Push), scheduler
  (cron + Redis leader election with Lua-CAS release + periodic
  renewal), throttling (per-student JWT.sub via Redis), parents
  (`/api/parents/me/children`). Dual-mode services switch to Prisma
  when `DATABASE_URL` is set.
- **Expo Student app** — auth (with the new consent UX) + curriculum
  browse + lesson view with KaTeX + practice quiz with SymPy-backed
  checking + streaming chat with Maya (cursor + abort + claim-validation
  events) + scan solver with image preprocessing. Pre-release banner
  gated on `EXPO_PUBLIC_PREVIEW_BANNER=1`.
- **Expo Parent app** — login + push registration + a real dashboard
  that fetches `/api/parents/me/children` with pull-to-refresh.
- **Expo Teacher app** — skeleton (boots + login + placeholder home).
  Teacher-scoped backend endpoints (roster, classes, progress) are
  the next chunk of work.
- **Prisma schema + 4 migrations** — initial (everything), conversations,
  push tokens, parental consent. Seed script hydrates curriculum from
  filesystem.
- **Sentry wiring** — backend (instrument-before-everything) + Expo app
  (init from `_layout.tsx`). No-op without DSN.
- **OpenAPI spec + codegen** — `services/backend-api/openapi.yaml` is the
  source of truth; `pnpm --filter @gomaths/api-client generate` produces
  `generated.ts`. CI fails on drift between the two.
- **Mail transport** — `services/backend-api/src/mail/`. Resend HTTP
  provider when `RESEND_API_KEY` is set, log-only fallback otherwise.
  Used today by the parental-consent invite; pluggable for other
  notifications.

### Stubbed but architected (need real work to ship)

- **`packages/auth`** — Auth0 swap path. ADR-005 left open; today's
  self-hosted JWT works, but school SSO will need Auth0.
- **Teacher / School Admin / Internal Admin / Tutor Marketplace** —
  Teacher app skeleton boots; the rest are README-only.
- **MathPix OCR** — provider is wired (`MathPixProvider`). Mock returns
  canned LaTeX. Real keys + provider switch flip it on.
- **Tutor Marketplace** — fully planned (`docs/Tutor_Marketplace_Plan.md`)
  with payment-dispute runbook; **no code yet**. Phase 1.5, gated on
  v2 launch signal.

### Documented but not done

- **AWS provisioning** — Terraform modules exist for VPC + RDS +
  ElastiCache + S3 + Secrets, wired together for a `dev` environment
  in `af-south-1`. **No EKS/Fargate/App Runner yet** — that's the next
  DevOps layer (decision in ADR-007 is **Fargate**, not EKS, at v2
  rollout scale). Operator still needs to bootstrap the tfstate
  backend and run apply.
- **Preview deploy** — Fly.io configs + Dockerfiles + a runbook at
  `infrastructure/preview/README.md` get the stack to a public URL in
  ~1–2 hours, but no one has run the commands yet.
- **Curriculum content** — 2 topics exist in the new SymPy-validatable
  format. v1's curriculum content needs format conversion (or
  re-authoring) — sizing this is the open product question.

---

## Your first day

Goal: get a local stack running and click through the full happy path
on your own machine. Don't add features. Don't refactor. Just verify
the foundation runs.

### Prerequisites

- macOS or Linux dev machine (Windows works via WSL2)
- Node 20.10 (use `.nvmrc`), pnpm 9.12
- Python 3.11
- Docker (for local Postgres + Redis)
- A free Sentry account (optional, for observability sanity check)

### The 8 commands

```sh
# 1. Clone + install. Lockfile is committed, so this is reproducible.
git clone git@github.com:vitalclick/GoMaths.git
cd GoMaths
pnpm install

# 2. Bring up local Postgres + Redis.
pnpm --filter @gomaths/backend-api db:up

# 3. Backend env. Generate fresh secrets — don't reuse anyone else's.
cat > services/backend-api/.env <<EOF
DATABASE_URL="postgresql://gomaths:devpass@localhost:5432/gomaths?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="$(openssl rand -base64 64)"
JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
PARENTAL_CONSENT_INVITE_SECRET="$(openssl rand -base64 64)"
PARENTAL_CONSENT_RECEIPT_SECRET="$(openssl rand -base64 64)"
PORT=4000
EOF

# 4. Schema + seed.
pnpm --filter @gomaths/backend-api prisma:migrate:deploy
pnpm --filter @gomaths/backend-api prisma:generate
pnpm --filter @gomaths/backend-api prisma:seed

# 5. AI services in three terminals (or tmux).
cd services/ai-services
pip install sympy fastapi 'uvicorn[standard]' pydantic anthropic openai pytest pytest-asyncio
uvicorn validation.main:app --port 8003   # terminal 1
uvicorn tutor.main:app --port 8001        # terminal 2 (defaults to mock LLM)
uvicorn solver.main:app --port 8002       # terminal 3

# 6. Backend.
pnpm --filter @gomaths/backend-api dev

# 7. Student app on web.
EXPO_PUBLIC_API_URL=http://localhost:4000 \
  pnpm --filter @gomaths/student dev
# press `w` for web

# 8. Smoke test in the browser:
#    Register (birth year 2012 to exercise the consent flow) →
#    backend stdout will log the consent invite URL — paste into your
#    address bar → click Confirm → back to the app, tap "I've
#    confirmed — check now" → Grade 9 → Solving Linear Equations →
#    Practice → answer "x = 4" → see "Correct" → back → Chat with
#    Maya → "Why does x equal 4?" → reply streams in with cursor.
```

### Day-one gotchas (predict the predictable)

1. **`pnpm install`** is reproducible because the lockfile is committed,
   but if you bump a dep and hit peer-dep tension, the usual suspect is
   Expo SDK 52 + React 19 + RN 0.76 alignment. Check
   the [Expo SDK 52 release notes](https://docs.expo.dev/) for the RN
   version pin.
2. **`expo-image-manipulator` ~13** may not be on npm yet for SDK 52;
   try `~12.0.x` or whatever the install error suggests.
3. **The postinstall katex bundler** runs `apps/student/scripts/bundle-katex-css.mjs`
   and reads from `node_modules/katex/dist/katex.min.css`. If that fails,
   the app falls back to a CDN — not a blocker.
4. **`prisma generate` is invoked as part of `backend-api` build** but
   wasn't run as part of install. If you see TS errors about missing
   `@prisma/client` types, run `pnpm --filter @gomaths/backend-api prisma:generate` manually.

If you hit something I haven't predicted, **commit the fix in a tiny
PR** before moving on.

---

## Your first week

Once Day 1 ends with green CI + a working local stack:

### Tuesday: a real LLM call

Get an Anthropic key (cheapest model: `claude-haiku-4-5`). Set
`TUTOR_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...` in the tutor
service env. Restart `uvicorn tutor.main:app`.

Send one message to Maya through the Student app. Confirm:

1. The reply streams in via SSE.
2. The "Verifying maths: x/y" indicator appears mid-stream.
3. The final "Maths verified" badge lights up.
4. Looking at the tutor service logs, the `cached_tokens` field is
   non-zero on the _second_ message to the same topic (proves prompt
   caching).

This is the single highest-value smoke test before anything else
happens. If validation doesn't catch a deliberately wrong answer when
you prompt Maya to give one, **that's the bug to fix first** — the
moat depends on it.

### Wednesday: the E2E suite

```sh
pnpm --filter @gomaths/e2e exec playwright install --with-deps chromium
pnpm --filter @gomaths/e2e test
```

The suite mocks the backend at the network boundary so it should pass
without a backend running. Fix any flakes; commit.

### Thursday: a preview URL

`infrastructure/preview/README.md` has the runbook for putting the
stack behind a public HTTPS URL on Fly.io + Cloudflare Pages, ~1–2
hours of operator work. Stand it up so internal stakeholders can click
through v2 before the AWS production environment is ready. Use new
Fly accounts and a fresh Anthropic key — don't reuse anything from v1.

### Friday: cutover planning + AWS

Two strands run in parallel from here:

1. **AWS af-south-1**. Bootstrap the tfstate backend (S3 bucket +
   DynamoDB lock table) under a fresh **clean-slate AWS account** —
   not anywhere v1 lives. Then apply the existing Terraform modules
   for VPC + RDS + ElastiCache + S3 + Secrets. Add the Fargate module
   (ADR-007) for compute. This is the v2 production landing.
2. **School cutover plan**. v2 doesn't migrate v1 data; existing
   schools re-onboard. That's a product/operations decision: which
   school is the first to onboard, what's the comms, how do learners
   carry over progress (they don't — they start fresh). Don't ship
   v2 to a school without this plan.

---

## Known risks (in priority order)

1. **The Anthropic prompt-caching assumption.** The tutor service ships
   with `cache_control: ephemeral` on every system block. The
   `/metrics/cache` endpoint exposes the live ratio; the smoke test is
   "GET it twice, expect `cache_hit_ratio > 0` on the second hit." If
   it stays at 0, the LLM bill is roughly 10× what the budget assumes.
   **Verify before signing any v2 onboarding agreement that quotes a
   per-learner cost.**

2. **Peer-dep version drift.** Expo SDK 52 + React 19 was current when
   the branch was written. If Expo 53 is out by the time you read this
   and anything refuses to install, **upgrade Expo first** — trying to
   hold the line on SDK 52 is the wrong fight.

3. **The grade-9-only curriculum (in the new format).** v1 has years
   of curriculum content; v2 needs it in the SymPy-validatable shape
   (see `curriculum-data/grade-9/algebra/solving-linear-equations/`
   for the schema). Format conversion vs. re-authoring is the open
   product call — until it's answered, content is the gating constraint.

4. **The OCR provider.** MathPix isn't wired. The mock returns canned
   answers cycled by image-length, which means the demo solver "works"
   but isn't real. Don't show the scan-solver to a school until
   MathPix is plumbed.

5. **v1 → v2 cutover is unengineered.** Bundle IDs are new (student:
   `com.gomaths.mathai`; parent / teacher under `com.gomaths.mathai.*`),
   so v2 ships as separate apps in the stores —
   v1 stays installed on learners' phones. The plan to migrate
   schools (comms, onboarding, parallel-running window, v1 sunset
   date) is a product/ops job, not engineering. Block onboarding the
   first school until this plan exists.

6. **`packages/auth` is empty.** Self-hosted JWT works for now; school
   SSO (SAML/OIDC) will need Auth0. ADR-005 is still open.

---

## Decisions still open

Tracked in `docs/Architecture_Decisions.md`. None block local dev, but
each shapes the v2 launch:

| Decision                                 | Why it matters                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Auth provider — self-hosted JWT vs Auth0 | School SSO will need SAML/OIDC; Auth0 has it, self-hosted doesn't (yet). ADR-005 open.                             |
| LLM provider as production default       | Cost model depends on Anthropic Haiku 4.5 cache hit rate. Verify via `/metrics/cache` once a real key is in tutor. |
| Curriculum format-conversion strategy    | v1 content → v2 SymPy-validatable format. Convert programmatically, re-author, or hybrid?                          |
| v1 → v2 cutover plan per school          | When each school cuts over, how learners are notified, when v1 sunsets. Product/ops, not engineering.              |
| Payment facilitator (Phase 1.5)          | Stitch / PayFast / Paystack-SA — only matters when the tutor marketplace builds.                                   |

---

## People who need to be on this

Adjust to match your current org. The roles below are the ones v2
actively demands — many may already exist on the v1 side:

| Role                                       | Why                                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Information Officer** (POPIA)            | Required for any DSAR; also signs off the v2 DPIA delta (new AI processing).                             |
| **Head of Curriculum**                     | Owns the v1→v2 content-format question; sets specialist throughput targets.                              |
| **SACE-registered Curriculum Specialists** | Author / convert topics to the new validatable format. Throughput per `docs/Curriculum_Content_Plan.md`. |
| **DevOps Engineer**                        | AWS af-south-1 provisioning + Fargate (ADR-007) + EAS setup for the new bundle IDs.                      |
| **Senior Expo/RN Engineer**                | Owns the three Expo apps + EAS Update channel for v2 (separate from v1).                                 |
| **Backend Engineer**                       | NestJS + Prisma; takes over from this branch.                                                            |
| **Curriculum Editor** (part-time)          | Final quality pass before any lesson reaches production.                                                 |

---

## Document map (read in this order)

You don't need to read everything before starting. Use this as a
lookup, not a syllabus.

### Week 1 essentials (read these)

1. **This file** (`HANDOFF.md`) — you're here.
2. [`README.md`](./README.md) — first-install checklist (slightly more
   detail than this file's "Day one").
3. [`runbooks/incident-response.md`](./runbooks/incident-response.md) —
   what to do if anything breaks in production. Read once now, not
   when you're on fire.
4. [`docs/Architecture_Decisions.md`](./docs/Architecture_Decisions.md) —
   the ADRs that shape every other choice in the repo, including
   ADR-007 (v2 rebuild + clean-slate AWS + Fargate).
5. [`infrastructure/preview/README.md`](./infrastructure/preview/README.md) —
   how to put the stack behind a public URL on Fly.io for stakeholder
   demos before the AWS production environment is ready.
6. [`docs/Phase0_Foundation_Notes.md`](./docs/Phase0_Foundation_Notes.md) —
   what's scaffolded vs. what's still TODO, in more detail.

### When you start touching curriculum

7. [`CONTRIBUTING.md`](./CONTRIBUTING.md) — curriculum PR workflow with
   the worked example for topic #3 (Pythagoras).
8. [`docs/Curriculum_Content_Plan.md`](./docs/Curriculum_Content_Plan.md) —
   throughput plan + 4-eye review rule.

### When you're planning the v2 rollout

9. [`docs/Phase1_Launch_Plan.md`](./docs/Phase1_Launch_Plan.md) —
   v2 build + rollout plan, team, decisions to make.
10. [`docs/DEPLOYMENT_INFO.md`](./docs/DEPLOYMENT_INFO.md) — the
    secret-management + accounts template. Fill in the placeholders
    as the v2 accounts get created.
11. [`docs/Demo_Script.md`](./docs/Demo_Script.md) — for stakeholder +
    school onboarding conversations. Already-built features only.

### When something specific breaks

12. [`runbooks/`](./runbooks) — five operational procedures. Index in
    `runbooks/README.md`.

### When Phase 1.5 (Tutor Marketplace) comes up

13. [`docs/Tutor_Marketplace_Plan.md`](./docs/Tutor_Marketplace_Plan.md)
    — full Phase 1.5 plan. Gated on v2 launch signal.

### Background (skim only)

14. [`docs/Preamble.md`](./docs/Preamble.md) — the original v1 vision.
    Aspirational; useful for context, not for planning.
15. [`docs/Development_Strategy.md`](./docs/Development_Strategy.md) —
    the technical strategy that shaped the ADRs. Already encoded in
    the code, so reading the code is faster.

---

## Questions worth asking

If any of these are unclear after reading the docs, escalate:

- Who owns the v2 Anthropic / OpenAI / MathPix API keys, and where are
  they stored? (Should be AWS Secrets Manager — Terraform stub exists.)
- Is the POPIA DPIA delta for the new AI processing in motion?
- What's the v1 curriculum format, and has anyone sized the
  conversion-vs-re-authoring decision?
- Is the v2 AWS account separate from v1's hosting?
- Which v1 school is the first cutover target, and is the
  onboarding-comms plan written?

The answer to all of these should be either "yes, here's the link" or
"no, that's blocking — I'll fix it this week." Anything else is risk.

---

## A note on what this branch is and isn't

This branch is the **v2 rebuild of GoMaths** on a clean tech stack —
comprehensive enough that the local stack boots end-to-end, CI runs
the full matrix on every PR, and a preview URL is one operator runbook
away. It is **not** yet running in production. v1 is what's serving
schools today; v2 replaces v1 only when:

1. AWS af-south-1 is provisioned (Terraform modules wired, Fargate
   layer added per ADR-007, operator has run `terraform apply`).
2. The curriculum is sized enough in the new SymPy-validatable format
   to onboard the first cutover school.
3. There's a written cutover plan for the first school — comms,
   onboarding sessions, parallel-running window with v1, sunset date.
4. The Anthropic prompt-cache assumption has been verified live
   (`/metrics/cache` shows `cache_hit_ratio > 0` after a warm-up).

The most useful thing you can do this week:

1. Run the stack locally (Day 1).
2. Stand up the Fly.io preview URL (Day 4) so internal stakeholders
   can see v2 click-by-click.
3. Get one real Anthropic key in front of the tutor and verify cache
   hits (Day 5).
4. Stop adding features until those three are done.

Adding more code on top of an unverified foundation is how rebuilds
fail. The foundation is here; verify it.
