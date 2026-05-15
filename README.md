# GoMaths

AI-powered mathematics learning platform for South African and African learners.

> **Status:** Pre-development. Planning documents, architecture decisions, and a scaffolded monorepo structure live here. Engineering begins after Phase 1 sign-off (see `docs/Phase1_Launch_Plan.md`).

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

| App | iOS | Android | Web | Phase |
|---|:-:|:-:|:-:|---|
| Student | ✓ | ✓ | ✓ | 1 |
| Parent | ✓ | ✓ | ✓ | 1 |
| Teacher | ✓ | ✓ | ✓ | 1 |
| School Admin | companion | companion | primary | 1 |
| Internal Admin | — | — | ✓ | 1 (incremental) |
| **Tutor** | ✓ | ✓ | ✓ | **1.5 (gated on Phase 1 signal)** |

---

## Current phase

**Pre-development.** Awaiting decisions in `docs/Phase1_Launch_Plan.md §11` and funding commitment (R 11.5–17.3M, 12-month runway).
