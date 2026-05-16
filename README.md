# GoMaths v2

AI-powered mathematics learning platform for South African and African learners.

> ## 👋 If you've just been handed this branch
>
> Read [**`HANDOFF.md`**](./HANDOFF.md) first. ~15 minutes. It explains
> what state the work is actually in, what your first day looks like,
> and which gotchas to expect.
>
> The first-install checklist below is the condensed command list;
> `HANDOFF.md` is the context around it.

> **Status: v2 rebuild on a clean stack.** GoMaths is an established
> product (10+ years, multiple South African schools under MOU, apps
> live in both stores). This branch is a **full rebuild** with a new
> tech stack, new AWS account, new app store listings (new bundle IDs:
> `co.za.gomaths.v2.*`), and a new database — **no migration of v1
> data or users**. The v1 product continues to run during the rebuild;
> v2 replaces it by re-onboarding schools and learners, not by lift-
> and-shift. See `docs/Phase1_Launch_Plan.md` for the rollout plan.

---

## Repository layout

Monorepo, managed with **pnpm + Turborepo** (see `docs/Architecture_Decisions.md` ADR-001).

```
gomaths/
├── apps/
│   ├── student/         Expo — iOS + Android + Web
│   ├── parent/          Expo — iOS + Android + Web
│   ├── teacher/         Expo — iOS + Android + Web
│   ├── tutor/           Expo — iOS + Android + Web (Phase 1.5, gated)
│   ├── school/          Web (Next.js, primary) + Expo companion (iOS + Android)
│   └── admin/           Next.js — Web only (internal ops)
├── packages/
│   ├── ui/              Shared component library (NativeWind, RN + RN-Web)
│   ├── design-tokens/   Brand tokens — palette, type, spacing, radius
│   ├── api-client/      Typed API client generated from OpenAPI
│   ├── types/           Shared domain types
│   └── auth/            Shared auth flows (POPIA-compliant)
├── services/
│   ├── backend-api/     NestJS — core REST/GraphQL API
│   └── ai-services/     Python FastAPI — solver, tutor, validation
├── infrastructure/      Terraform + k8s + CI/CD
├── curriculum-data/     Lesson content, question banks
├── UI/                  Designer mockups (design1, design2) — visual reference only
└── docs/                Planning, architecture, strategy
```

Each top-level directory has its own `README.md` describing scope, stack, and status.

---

## Documentation

Read in this order:

1. [`docs/Preamble.md`](docs/Preamble.md) — original product vision
2. [`docs/Development_Strategy.md`](docs/Development_Strategy.md) — full technical strategy
3. [`docs/Phase1_Launch_Plan.md`](docs/Phase1_Launch_Plan.md) — **executable Phase 1 build plan** (4 apps × 3 platforms, 9–12 months)
4. [`docs/Curriculum_Content_Plan.md`](docs/Curriculum_Content_Plan.md) — how content gets authored
5. [`docs/Tutor_Marketplace_Plan.md`](docs/Tutor_Marketplace_Plan.md) — Phase 1.5 marketplace plan (gated on Phase 1 signal)
6. [`docs/Architecture_Decisions.md`](docs/Architecture_Decisions.md) — running ADR log
7. [`docs/Phase0_Foundation_Notes.md`](docs/Phase0_Foundation_Notes.md) — hand-off note: what's scaffolded and what comes next

---

## Platforms shipping in Phase 1

| App            |    iOS    |  Android  |   Web   | Phase                             |
| -------------- | :-------: | :-------: | :-----: | --------------------------------- |
| Student        |     ✓     |     ✓     |    ✓    | 1                                 |
| Parent         |     ✓     |     ✓     |    ✓    | 1                                 |
| Teacher        |     ✓     |     ✓     |    ✓    | 1                                 |
| School Admin   | companion | companion | primary | 1                                 |
| Internal Admin |     —     |     —     |    ✓    | 1 (incremental)                   |
| **Tutor**      |     ✓     |     ✓     |    ✓    | **1.5 (gated on Phase 1 signal)** |

---

## First-install checklist

The stack runs end-to-end on a clean machine: `pnpm-lock.yaml` is
committed, the API client codegen output is real, CI runs the full
typecheck + lint + format + E2E matrix. The steps below are the
condensed command list for getting a working local dev environment.

### Prerequisites

- Node 20.10 (`.nvmrc`)
- pnpm 9.12
- Python 3.11
- Docker (for local Postgres + Redis)
- An Anthropic OR OpenAI API key (or skip and stay on the mock provider)

### 1. Clone + install

```sh
git clone git@github.com:vitalclick/GoMaths.git
cd GoMaths
pnpm install
```

If `pnpm install` errors after a dependency bump, the usual suspect is
peer-dep tension between Expo SDK 52 + React 19 + RN 0.76 +
NativeWind 4. Fix one package version at a time and rerun.

### 2. Re-run the API client codegen (only after editing openapi.yaml)

```sh
pnpm --filter @gomaths/api-client generate
```

This regenerates `packages/api-client/src/generated.ts` from
`services/backend-api/openapi.yaml`. CI fails on drift between the two,
so commit the result.

### 3. Bring up Postgres + Redis

```sh
pnpm --filter @gomaths/backend-api db:up
```

Then:

```sh
cat >> services/backend-api/.env <<EOF
DATABASE_URL="postgresql://gomaths:devpass@localhost:5432/gomaths?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="$(openssl rand -base64 64)"
JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
EOF

pnpm --filter @gomaths/backend-api prisma:migrate:deploy
pnpm --filter @gomaths/backend-api prisma:generate
pnpm --filter @gomaths/backend-api prisma:seed
```

### 4. Start the AI services

```sh
# In services/ai-services/
pip install -r <(echo "sympy fastapi 'uvicorn[standard]' pydantic anthropic openai")

# Three terminals (or use `tmux`):
uvicorn validation.main:app --port 8003
uvicorn tutor.main:app --port 8001         # set TUTOR_PROVIDER=anthropic + key for real LLM
uvicorn solver.main:app --port 8002
```

### 5. Start the backend

```sh
pnpm --filter @gomaths/backend-api dev
```

Hit `http://localhost:4000/api/health` and `/api/docs` (Swagger).

### 6. Start the Student app

```sh
EXPO_PUBLIC_API_URL=http://localhost:4000 \
  pnpm --filter @gomaths/student dev
# press `w` for web, `i` for iOS sim, `a` for Android emu
```

### 7. Smoke-test the full flow

1. Register an account. Use a birth year that makes you 18+ for the quickest path, or under 18 to exercise the parental-consent flow (the invite URL is logged to the backend's stdout when `RESEND_API_KEY` isn't set).
2. Pick Grade 9
3. Open "Solving Linear Equations"
4. Practice — answer `x = 4` to `2x + 5 = 13` → "Correct" (SymPy-validated via the backend)
5. Chat with Maya — confirm the reply streams in and the "Maths verified" badge appears (or "Reply not fully verified" if the mock provider is on)

### 8. Run the E2E suite

```sh
pnpm --filter @gomaths/e2e test
```

The suite mocks the backend at the network boundary, so it should
pass independently of whether the backend is running.

### When stuck

- `runbooks/incident-response.md` — for production
- `services/backend-api/prisma/README.md` — DB workflow detail
- `docs/Phase0_Foundation_Notes.md` — what's scaffolded vs. what isn't
- `runbooks/` index — operational procedures

## Current phase

**v2 rebuild — engineering in progress.** v1 of GoMaths is live and
serving schools today. This branch rebuilds the product on a new tech
stack (Expo + NestJS + AI services + SymPy validation) on a clean AWS
account with new app store listings. v1 continues to run; v2 launches
when the rebuild is feature-complete for the initial school rollout.
See `docs/Phase1_Launch_Plan.md` for the v2 rollout plan and ADR-007
for the clean-slate decision.
