# v2 Stack — What's Built, What's Next

State-of-the-stack note for the team taking the v2 rebuild forward.
Replaces the old "Phase 0 Foundation" framing, which described pre-
development scaffolding — that work is done.

## What's built and tested

### Monorepo

`package.json`, `pnpm-workspace.yaml`, `turbo.json`,
`tsconfig.base.json`, `.prettierrc.json`, `.editorconfig`, `.nvmrc`,
`.npmrc`, **`pnpm-lock.yaml` committed**. `pnpm install` is
reproducible.

### Packages (`packages/`)

- **`@gomaths/design-tokens`** — typed exports of GoMaths colors
  (oklch), typography (Sora/Inter/JetBrains Mono), spacing, radius,
  shadow. Tailwind preset at `@gomaths/design-tokens/tailwind`.
- **`@gomaths/types`** — shared domain types (`User`, `Student`,
  `Parent`, `Teacher`, `Grade`, `TopicMetadata`, `Question`,
  `ProgressEvent`).
- **`@gomaths/ui`** — `Button` and `Card` using NativeWind + CVA, with
  the `nativewind/types` reference that makes `className` valid on RN
  primitives. Pattern for the rest of the library.
- **`@gomaths/api-client`** — **real OpenAPI codegen output**
  committed. CI fails on drift between `openapi.yaml` and
  `generated.ts`.
- **`@gomaths/auth`** — still stubbed, blocked on ADR-005.

### Apps (`apps/`)

- **`@gomaths/student`** — Expo app with the full happy path: auth
  with the real parental-consent flow, curriculum browse, lesson view
  (KaTeX in WebView), practice with SymPy-backed checking, streaming
  tutor chat with Maya, scan solver, progress, conversations. New
  bundle ID: `com.gomaths.mathai`. Pre-release banner gated on
  `EXPO_PUBLIC_PREVIEW_BANNER=1`.
- **`@gomaths/parent`** — login + push registration + a real
  dashboard fetching `/api/parents/me/children` with pull-to-refresh.
  Bundle: `com.gomaths.mathai.parent`.
- **`@gomaths/teacher`** — skeleton that boots: login + placeholder
  home. Teacher-scoped backend endpoints are the next chunk.
  Bundle: `com.gomaths.mathai.teacher`.
- **`apps/tutor/`, `apps/school/`, `apps/admin/`** — README stubs.

### Services (`services/`)

- **`backend-api/`** — NestJS app with the full module set: auth,
  refresh rotation, parental-consent state machine, curriculum,
  progress, tutor (SSE streaming), solver, notifications, scheduler
  (Lua-CAS leader lock with periodic renewal), throttling, parents,
  mail (Resend HTTP, log-only fallback). 31 jest specs passing.
  - **`openapi.yaml`** — source of truth, kept in sync with
    `generated.ts` by CI.
  - **`prisma/schema.prisma`** — 4 migrations: initial, conversations,
    push tokens, parental consent.
- **`ai-services/`** — 3 FastAPI services and `tutor/metrics.py`
  aggregator. 44 pytest specs passing.
  - `validation/` — SymPy-backed validator. Conservative.
  - `tutor/` — `/chat`, `/chat/stream` (SSE), `/metrics/cache`.
    Anthropic, OpenAI, and Mock providers.
  - `solver/` — `/scan`, `/solve`. MathPix provider wired but
    defaults to the mock.

### Curriculum (`curriculum-data/`)

- 2 Grade 9 algebra topics in the new SymPy-validatable format
  (`solving-linear-equations`, `laws-of-exponents`), 7 questions
  total, all verified by `scripts/validate_curriculum.py`.

### Infrastructure (`infrastructure/`)

- `terraform/modules/` — `network/`, `database/`, `cache/`, `storage/`,
  `secrets/`. Wired together in `terraform/environments/dev/` for
  `af-south-1`. Compute layer (Fargate per ADR-007) not yet added.
- `preview/README.md` — Fly.io + Cloudflare Pages preview-deploy
  runbook. Dockerfiles + four `fly.*.toml` files at the repo root.

### CI (`.github/workflows/ci.yml`)

Three jobs, all green on every PR:

1. **Python** — runs the 44 ai-services pytest specs.
2. **Curriculum** — runs the SymPy validator against every authored
   answer.
3. **Node** — `pnpm install --frozen-lockfile` + `prisma generate` +
   OpenAPI codegen drift check + typecheck + format check + lint +
   Playwright E2E.

## What still needs real work

| Missing                                        | What it needs                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Production deploy**                          | Operator runs `fly deploy` (preview) or applies the AWS Terraform + Fargate module (prod). |
| **EKS / Fargate Terraform module**             | ~0.5 day to write; trigger is the first signed v2 cutover date.                            |
| **Auth0 swap path**                            | ADR-005 still open. School SSO will need it.                                               |
| **MathPix OCR**                                | Contract + provider switch flip.                                                           |
| **Real LLM key + cache-rate verification**     | `/metrics/cache` shows `cache_hit_ratio > 0` on second warm chat.                          |
| **Teacher-scoped backend endpoints**           | `/api/teachers/me/classes`, students, assignments. Teacher app is waiting.                 |
| **School Admin / Internal Admin / Tutor apps** | README-only today.                                                                         |
| **Curriculum beyond Grade 9 algebra**          | Format-conversion vs re-authoring decision; SACE specialists in flight.                    |
| **v1 → v2 cutover plan per school**            | Product/ops, not engineering.                                                              |

## How to verify what's here works

```sh
# Python — 44 tests + curriculum
cd services/ai-services && pytest -q
cd .. && python curriculum-data/scripts/validate_curriculum.py

# Node — full pipeline
pnpm install
pnpm --filter @gomaths/backend-api prisma:generate
pnpm typecheck
pnpm --filter @gomaths/backend-api test
pnpm format:check
```

All of the above should pass without modification on a clean clone.

## Recommended next-week sequence

1. **DevOps:** run the Fly.io preview deploy runbook end-to-end.
   That's the fastest way to put v2 in front of internal stakeholders.
2. **Backend:** wire MathPix into the solver provider switch (real
   key, flip `SOLVER_OCR_PROVIDER=mathpix`).
3. **AI engineer:** verify Anthropic prompt caching live —
   `/metrics/cache` should show `cache_hit_ratio > 0` after two warm
   chats to the same topic.
4. **Curriculum lead:** size the v1 → v2 format conversion. Concrete
   output: a count of topics convertible programmatically vs. requiring
   re-authoring.
5. **DevOps:** bootstrap the v2 AWS account, apply the Terraform
   modules, add the Fargate module (ADR-007).
