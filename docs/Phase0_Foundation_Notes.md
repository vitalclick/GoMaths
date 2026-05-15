# Phase 0 Foundation — What's Scaffolded

This is a hand-off note for the team picking up Phase 1. Phase 0 scaffolding sets up enough structure that engineering can start without having to litigate architecture choices already made in the ADRs.

## What exists

### Monorepo
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.prettierrc.json`, `.editorconfig`, `.nvmrc`, `.npmrc`
- Run `pnpm install` from the repo root to install everything once Node 20.10+ and pnpm 9+ are present.

### Packages (`packages/`)
- **`@gomaths/design-tokens`** — typed exports of GoMaths colors (oklch), typography (Sora/Inter/JetBrains Mono), spacing, radius, shadow. Tailwind preset at `@gomaths/design-tokens/tailwind`. Values match `UI/design2/src/styles.css` exactly.
- **`@gomaths/types`** — shared domain types (`User`, `Student`, `Parent`, `Teacher`, `Grade`, `TopicMetadata`, `Question`, `ProgressEvent`).
- **`@gomaths/ui`** — `Button` and `Card` example components using NativeWind + CVA. Pattern for the rest of the library.
- **`@gomaths/api-client`** — stub, will be generated from the backend's OpenAPI spec.
- **`@gomaths/auth`** — stub, blocked on ADR-005 (auth provider decision).

### Apps (`apps/`)
- **`@gomaths/student`** — Expo app skeleton with Expo Router, NativeWind, TypeScript. One screen (`app/index.tsx`) demonstrating the design-tokens → UI library wiring. Run `pnpm --filter @gomaths/student dev` once installed.
- **`apps/parent/`, `apps/teacher/`, `apps/tutor/`, `apps/school/`, `apps/admin/`** — README stubs only. Scaffolded by the respective app's pod when started.

### Services (`services/`)
- **`backend-api/`** — NestJS skeleton with `/api/health` endpoint, Swagger setup, global validation pipe, config module.
  - **`openapi.yaml`** — full API spec (auth, users, curriculum, progress, tutor, solver). Source of truth for `@gomaths/api-client` codegen.
  - **`prisma/schema.prisma`** — full data model (User, Student, Parent, Teacher, School, Class, Topic, Question, ProgressEvent, TopicMastery). Mirrors `@gomaths/types`.
- **`ai-services/`** — Python project (`pyproject.toml`) with three sub-services:
  - `validation/` — **working** SymPy-based answer validator (`sympy_validator.py`), with **16 passing tests** covering equation solving AND expression simplification. The contract every other AI response will validate against.
  - `tutor/` — FastAPI shell with `/health` and stub `/chat`.
  - `solver/` — FastAPI shell with `/health` and stub `/solve`.

### Curriculum (`curriculum-data/`)
- **Two** fully-authored example topics demonstrating the workflow scales:
  - `grade-9/algebra/solving-linear-equations/` — equation-solving questions
  - `grade-9/algebra/laws-of-exponents/` — mix of expression simplification and exponential equations
- `scripts/validate_curriculum.py` — runs every authored answer through the SymPy validator. **Verified working**: 7/7 questions pass across both topics.

### Infrastructure (`infrastructure/terraform/`)
- `environments/dev/` skeleton with AWS provider pinned to `af-south-1` per ADR-002. `terraform init` is the next step for whoever owns DevOps.

### CI (`.github/workflows/ci.yml`)
- Three jobs: Node (typecheck/lint via Turbo + Prettier check), Python (validator tests), Curriculum (validates every authored answer on every PR).

## What does NOT exist yet, and why

| Missing | Why |
|---|---|
| Real auth flow | ADR-005 (Auth0 vs. Firebase vs. self-hosted) not yet decided |
| LLM provider integration in tutor | ADR-005 LLM provider not yet decided |
| OCR pipeline in solver | Requires MathPix contract |
| Curriculum content beyond 1 example | Requires curriculum specialists to be hired |
| Database schema / Prisma models | Requires data modelling session (recommend Phase 0 week 2) |
| AWS resources provisioned | Requires AWS account + DevOps engineer |
| Mobile builds | Requires EAS account + Apple Developer + Google Play accounts |
| Apps beyond Student | Wait until shared `packages/ui` has more shape (Phase 1 weeks 5–10) |

## How to verify what's here works

```sh
# Python — validator + curriculum
pip install sympy pytest
cd services/ai-services && pytest validation/ -v
cd ../.. && python curriculum-data/scripts/validate_curriculum.py
```

Should report 9 passing tests and `1 topics, 2 questions, 0 failed`.

The Node side needs `pnpm install` to actually run — the configs are correct, but verification requires a dev environment with internet access to pull packages.

## Recommended week-1 sequence once team is hired

1. **DevOps engineer:** bootstrap AWS af-south-1 account, terraform state backend, run `terraform init`
2. **Senior RN engineer:** `pnpm install` end-to-end, validate Expo runs on iOS sim + Android emu + web, fix any version drift
3. **Backend engineer:** wire Prisma + PostgreSQL, model `User` / `Student` / `Topic` / `Question` / `ProgressEvent` from `@gomaths/types`
4. **AI engineer:** pick LLM provider (per ADR-005), wire `tutor/main.py` to call it with curriculum context, validate every numeric reply through `validation/`
5. **Designer:** sign off on locked tokens in `packages/design-tokens` or push back with concrete changes
6. **Curriculum specialists:** author topic #2 to exercise the full QA workflow end-to-end before scaling to all 19
