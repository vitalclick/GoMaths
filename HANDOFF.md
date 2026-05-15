# GoMaths — Handoff

You're picking up a planning + scaffolding effort that produced a large
branch (~40 commits, hundreds of files) but **has not yet run on a
machine other than the one that wrote it**. This document is the
shortest path I can give you from clone to "yes, this works."

Read time: ~15 minutes. Suggested reading order at the bottom — but
start here.

---

## TL;DR

- **What this is**: a Phase 1 buildout of an AI-powered Grade R–12 maths app for South African learners, CAPS-aligned, with an LLM tutor whose maths claims are verified by SymPy before reaching the learner.
- **State**: code is comprehensive and internally consistent; nothing has actually executed against real Postgres, real Redis, a real LLM key, or a real device.
- **CI**: green, but currently only verifies the two things that truly work today — Python tests (40 pass) + curriculum answer validation. The Node + E2E jobs are gated behind `if: ${{ false }}` until a real `pnpm install` succeeds and produces a lockfile.
- **First job**: run `pnpm install` on a real machine, fix whatever breaks, commit the lockfile, re-enable CI. Everything else flows from there.
- **The most important thing to keep**: the validator gate. Every authored answer, every tutor reply that contains a maths claim, is checked by SymPy. That's the moat.

---

## State of the work

Honest snapshot. Trust this list more than any individual file's optimism.

### Working (verified on the laptop that wrote it)

- **SymPy validator** — `services/ai-services/validation/`. 16 tests pass.
  Handles equation-solving and expression-simplification shapes.
  Conservative: returns `NOT_VERIFIED` rather than guessing.
- **Curriculum validator pipeline** — `curriculum-data/scripts/validate_curriculum.py`
  walks every authored topic, checks every answer through SymPy. Wired
  into CI. 2 Grade 9 algebra topics, 7 questions, 0 failed.
- **AI services unit tests** — 40 pytest specs (validator + tutor +
  solver + claim extractor + curriculum loader) all pass.
- **LLM provider abstraction** — Anthropic + OpenAI + Mock. Tests use
  monkeypatched SDKs so no real API key is needed in CI. Real keys
  switch the providers via `TUTOR_PROVIDER` env.

### Built but never run end-to-end

- **NestJS backend** — auth (self-hosted JWT + refresh rotation),
  curriculum (filesystem-loaded), progress, tutor (streaming + history),
  solver (multipart upload), notifications (Expo Push), scheduler
  (cron + Redis leader election), throttling (per-student JWT.sub).
  Dual-mode services switch to Prisma when `DATABASE_URL` is set.
- **Expo Student app** — auth + curriculum browse + lesson view with
  KaTeX + practice quiz with SymPy-backed checking + streaming chat
  with Maya (cursor + abort + claim-validation events) + scan solver
  with image preprocessing.
- **Expo Parent app** — boots, has login + push registration + a
  placeholder dashboard. Phase 1.5 scaffold.
- **Prisma schema + 3 migrations** — initial (everything), conversations,
  push tokens. Seed script that hydrates curriculum from filesystem.
- **Sentry wiring** — backend (instrument-before-everything) + Expo app
  (init from `_layout.tsx`). No-op without DSN.
- **OpenAPI spec + codegen** — `services/backend-api/openapi.yaml` is the
  source of truth; `pnpm --filter @gomaths/api-client generate` produces
  `generated.ts`. Today's committed `generated.ts` is a stub.

### Stubbed but architected (need real work to ship)

- **`packages/auth`** — Auth0 swap path. ADR-005 left open; today's
  self-hosted JWT works, but the school-SSO requirement Phase 1 will
  bring needs Auth0.
- **`packages/api-client/src/generated.ts`** — replaced when codegen
  actually runs.
- **All apps other than Student + Parent** — Teacher, Tutor marketplace,
  School Admin, Internal Admin. Each has a README pinning scope.
- **MathPix OCR** — provider is wired (`MathPixProvider`). Mock returns
  canned LaTeX. Real keys + provider switch flip it on.
- **Parental consent token** — register endpoint accepts a stub token
  `stub:<email>`. Real flow (email confirmation link mints a real
  signed token) is Phase 1 work.
- **Tutor Marketplace** — fully planned (`docs/Tutor_Marketplace_Plan.md`)
  with payment-dispute runbook; **no code yet**. Phase 1.5, gated on
  Phase 1 pilot signal.

### Documented but not done

- **AWS provisioning** — Terraform skeleton in `infrastructure/`. One
  empty environment (`dev`) pinned to `af-south-1`. No EKS, no RDS, no
  ElastiCache, no actual resources defined. That's DevOps engineer
  week-one work.
- **Pilot school MOUs** — 4 schools needed (6 signed to land 4). Zero
  signed.
- **Curriculum content beyond Grade 9 algebra** — 19 Grade 9 topics
  needed for the pilot; 2 exist (linear equations, exponents).
  `CONTRIBUTING.md` has the worked example for topic #3 (Pythagoras).

---

## Your first day

Goal: get the existing code to **execute** somewhere other than the
machine that wrote it. Don't add features. Don't refactor. Just run it.

### Prerequisites

- macOS or Linux dev machine (Windows works via WSL2)
- Node 20.10 (use `.nvmrc`), pnpm 9.12
- Python 3.11
- Docker (for local Postgres + Redis)
- A free Sentry account (optional, for observability sanity check)

### The 10 commands

```sh
# 1. Clone + base install. Expect friction. See "Day-one gotchas" below.
git clone git@github.com:vitalclick/GoMaths.git
cd GoMaths
git checkout claude/analyze-project-brief-U8d3u   # this branch
pnpm install

# 2. Real codegen for the API client (replaces the stub).
pnpm --filter @gomaths/api-client generate

# 3. Bring up local Postgres + Redis.
pnpm --filter @gomaths/backend-api db:up

# 4. Backend env. Generate fresh secrets, don't copy the example.
cat > services/backend-api/.env <<EOF
DATABASE_URL="postgresql://gomaths:devpass@localhost:5432/gomaths?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="$(openssl rand -base64 64)"
JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
PORT=4000
EOF

# 5. Schema + seed.
pnpm --filter @gomaths/backend-api prisma:migrate:deploy
pnpm --filter @gomaths/backend-api prisma:generate
pnpm --filter @gomaths/backend-api prisma:seed

# 6. AI services in three terminals (or tmux).
cd services/ai-services
pip install sympy fastapi 'uvicorn[standard]' pydantic anthropic openai pytest pytest-asyncio
uvicorn validation.main:app --port 8003  # terminal 1
uvicorn tutor.main:app --port 8001       # terminal 2 (defaults to mock LLM)
uvicorn solver.main:app --port 8002      # terminal 3

# 7. Backend.
pnpm --filter @gomaths/backend-api dev

# 8. Student app on web.
EXPO_PUBLIC_API_URL=http://localhost:4000 \
  pnpm --filter @gomaths/student dev
# press `w` for web

# 9. Smoke test in the browser:
#    register (birth year 1995) → Grade 9 → Solving Linear Equations
#    → Practice → answer "x = 4" → see "Correct" → back → Chat with Maya
#    → "Why does x equal 4?" → reply streams in with cursor.

# 10. Commit the lockfile + real generated.ts.
git add pnpm-lock.yaml packages/api-client/src/generated.ts
git commit -m "First real install + codegen output"
```

Then **flip the four `if: ${{ false }}` guards** in
`.github/workflows/ci.yml` (Node typecheck, Node lint, Node format,
Node codegen check, E2E). Push. Watch the full CI matrix run for real.

### Day-one gotchas (predict the predictable)

1. **`pnpm install` peer-dep tension.** Likely friction points:
   - Expo SDK 52 + React 19 + RN 0.76 alignment. If a peer fails,
     check the [Expo SDK 52 release notes](https://docs.expo.dev/) for
     the exact RN version.
   - NativeWind 4 + Tailwind 3.4 vs. 4.x. The lessons render through
     a WebView, so Tailwind itself isn't on the hot path — pin to
     whatever NativeWind 4 demands.
   - `react-native-webview` 13.x and `react-native-sse` 1.2.x both
     need RN-compatible versions. If pnpm refuses, run with
     `--no-strict-peer-dependencies` once to get past it, then fix
     the offending peer.
2. **`expo-image-manipulator` ~13** may not be on npm yet for SDK 52;
   try `~12.0.x` or whatever the install error suggests.
3. **`@nest-lab/throttler-storage-redis` ^1.4.2** has tight Nest version
   coupling. If it complains, downgrade.
4. **The postinstall katex bundler** runs `apps/student/scripts/bundle-katex-css.mjs`
   and reads from `node_modules/katex/dist/katex.min.css`. If that fails,
   the app falls back to a CDN — not a blocker.
5. **`prisma generate` is invoked as part of `backend-api` build** but
   wasn't run as part of install. If you see TS errors about missing
   `@prisma/client` types, run `pnpm --filter @gomaths/backend-api prisma:generate` manually.
6. **`pnpm-workspace.yaml`** includes `e2e` as a package. If the
   Playwright workspace causes resolution issues, temporarily comment it
   out, get the rest installing, then bring it back.

If you hit something I haven't predicted, **commit the fix in a tiny
PR** before moving on. That fix is exactly what this branch was missing.

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
   non-zero on the *second* message to the same topic (proves prompt
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

### Thursday: a real device

EAS setup (DEPLOYMENT_INFO.md §3 has the field map). Build the Student
app for iOS + Android via EAS Build. Install on a real Samsung A-series
phone — the Android perf target. Sign in. Confirm the WebView-rendered
lessons render fast enough not to feel broken.

### Friday: hire decisions

By end of week 1 you should have a clearer read on:
- What's actually broken vs. what's working
- Whether the architecture holds up under real use
- What needs to go on the Phase 1 hiring spec (probably more than the
  17 FTE the plan currently estimates)

Update `docs/Phase1_Launch_Plan.md` with what you learned. The plan
is a draft, not a contract — your first week's experience is the best
input the plan has had.

---

## Known risks (in priority order)

1. **The Anthropic prompt-caching assumption.** The tutor service ships
   with `cache_control: ephemeral` on every system block. If that
   doesn't fire in production (wrong model, wrong API version), the
   LLM bill is roughly 10× what the financial plan assumes. **Verify
   `cached_tokens > 0` on the second request before signing pilot
   contracts.**

2. **Peer-dep version drift.** Expo SDK 52 + React 19 was bleeding-edge
   when the branch was written. By the time you read this, Expo 53 may
   be out. If anything refuses to install, **upgrade Expo first** —
   trying to hold the line on SDK 52 is the wrong fight.

3. **The Parent app's split storage keys.** `gomaths.parent.*` vs.
   `gomaths.*` means a parent + child sharing a device can both stay
   signed in. That's a feature, but it also means push tokens may be
   duplicated. Test this on a real device.

4. **The leader election lock TTL.** Streak reminder cron holds the
   lock for 30 minutes. If you ever push to >100k students and the
   fan-out takes longer, you'll get duplicate pushes. Phase 1 should
   add lock renewal inside long-running tasks.

5. **CI is scoped down.** Today the Node job verifies JSON syntax only.
   Don't trust green CI to catch a TypeScript regression until you've
   committed the lockfile and re-enabled the full pipeline. Your first
   real PR will tell you what those blocking checks actually catch.

6. **The grade-9-only curriculum.** Pilot success is gated on 19
   topics being authored + verified by SACE-registered specialists.
   Two exist. The bottleneck is content, not code.

7. **The OCR provider.** MathPix isn't wired. The mock returns canned
   answers cycled by image-length, which means the demo solver "works"
   but isn't real. Don't show this to a school until MathPix is plumbed.

---

## Decisions you'll need to make in week 2

These are open in `docs/Architecture_Decisions.md` and
`docs/Phase1_Launch_Plan.md §11`. None of them are blocking week-one
work, but they shape week 3 onwards:

| Decision | Why it matters |
|---|---|
| Auth provider — self-hosted JWT vs Auth0 | School SSO will need SAML/OIDC; Auth0 has it, self-hosted doesn't (yet) |
| LLM provider as production default | Phase 1 budget depends on Anthropic Haiku 4.5 cache hit rate; verify, then choose |
| Pilot school grade band | Plan recommends Grade 9; talk to the schools, confirm |
| Payment facilitator (Phase 1.5) | Stitch / PayFast / Paystack-SA — only matters when the marketplace builds |
| Funding commitment | R 11.5–17.3M, 12-month runway. Don't start hiring against this without it confirmed |

---

## People to set up

The branch assumes these roles exist; today they don't:

| Role | Why before pilot |
|---|---|
| **Information Officer** (POPIA) | Required to sign off on every data-subject request; also fronts the consent flow |
| **Head of Curriculum** | Curriculum is the critical path; without this hire, topics #3–19 don't happen |
| **2 SACE-registered Curriculum Specialists** | Topic throughput is 2/week per specialist per `docs/Curriculum_Content_Plan.md` |
| **DevOps Engineer** | AWS af-south-1 provisioning, Terraform expansion, EAS setup |
| **Senior Expo/RN Engineer** | Day-1 install fixes; ongoing UI work |
| **Backend Engineer** | NestJS + Prisma; takes over from this branch |
| **Curriculum Editor** (part-time) | Final quality pass before any lesson reaches production |

Hire the **Curriculum Lead + 2 Specialists FIRST** — they have the
longest ramp + are the critical path. Engineering can run in parallel.

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
   the 6 ADRs that shape every other choice in the repo.
5. [`docs/Phase0_Foundation_Notes.md`](./docs/Phase0_Foundation_Notes.md) —
   what's scaffolded and what isn't, in more detail.

### When you start touching curriculum

6. [`CONTRIBUTING.md`](./CONTRIBUTING.md) — curriculum PR workflow with
   the worked example for topic #3 (Pythagoras).
7. [`docs/Curriculum_Content_Plan.md`](./docs/Curriculum_Content_Plan.md) —
   throughput plan + 4-eye review rule.

### When you're planning Phase 1 in earnest

8. [`docs/Phase1_Launch_Plan.md`](./docs/Phase1_Launch_Plan.md) —
   16-week build plan, team, budget, decisions to make.
9. [`docs/DEPLOYMENT_INFO.md`](./docs/DEPLOYMENT_INFO.md) — the
   secret-management + accounts template. Fill in the placeholders as
   accounts get created.
10. [`docs/Demo_Script.md`](./docs/Demo_Script.md) — for investor +
    pilot-school conversations. Already-built features only.

### When something specific breaks

11. [`runbooks/`](./runbooks) — five operational procedures. Index in
    `runbooks/README.md`.

### When Phase 1.5 (Tutor Marketplace) comes up

12. [`docs/Tutor_Marketplace_Plan.md`](./docs/Tutor_Marketplace_Plan.md)
    — full Phase 1.5 plan. Gated on Phase 1 pilot signal; don't start
    building unless the pilot succeeded.

### Background (skim only)

13. [`docs/Preamble.md`](./docs/Preamble.md) — the original vision.
    Aspirational; useful for context, not for planning.
14. [`docs/Development_Strategy.md`](./docs/Development_Strategy.md) —
    the technical strategy that shaped the ADRs. Already encoded in
    the code, so reading the code is faster.

---

## What I think your real first PR will be

If I had to predict the very first PR you open on this branch, in
order of likelihood:

1. **`fix: pnpm install peer-dep resolution`** — version pin changes
   to get install through.
2. **`chore: commit pnpm-lock.yaml + real generated.ts`** — the
   moment things actually compose.
3. **`ci: re-enable typecheck + lint + format + codegen + e2e`** —
   flip the `if: ${{ false }}` guards.
4. **`fix: <whatever first thing typecheck catches>`** — there will be
   real TypeScript errors I couldn't see from here.

That sequence is normal. Take it as the cost of the previous step
being "no machine."

---

## Questions worth asking

If any of these are unclear after reading the docs, escalate:

- Who owns the Anthropic / OpenAI / MathPix API keys, and where are
  they stored? (Should be AWS Secrets Manager per
  `docs/DEPLOYMENT_INFO.md §1`; confirm.)
- Has the POPIA DPIA been started? (`§9`)
- Are the 4 pilot schools identified, and is anyone signing MOUs?
- Is funding actually committed for the R 11.5–17.3M Phase 1 envelope,
  or is this still a fundraising exercise?
- Is the SACE-registered curriculum specialist hire in flight, or are
  we waiting on it?

The answer to all of these should be either "yes, here's the link" or
"no, that's blocking — I'll fix it this week." Anything else is risk.

---

## A note on what this branch is and isn't

This branch is the **scaffolding** for GoMaths Phase 1 — comprehensive
enough that any competent engineer can clone, fix the install drift,
and start shipping real product changes inside a week. It is **not** a
shippable product. It hasn't been validated against real learners,
real teachers, real schools, or even a real cloud environment.

The single best thing you can do for the project is:

1. Get the code running locally (Day 1)
2. Get one real LLM call through end-to-end (Tuesday)
3. Stop adding features until Step 2 is rock solid

Adding more code on top of an unverified foundation is how venture-
scale software fails. The foundation is here; verify it.

Good luck. Happy to be paged in for the postmortem when something
breaks I should have predicted.
