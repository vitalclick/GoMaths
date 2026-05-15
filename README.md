# GoMaths

AI-powered mathematics learning platform for South African and African learners.

> **Status:** Pre-MVP. This repository currently contains planning documents and a scaffolded directory structure. Implementation begins after MVP scope sign-off.

---

## Repository layout

```
gomaths/
├── mobile-app/          # React Native — Student app (MVP)
├── admin-portal/        # Next.js — internal admin & curriculum mgmt (Phase 2)
├── backend-api/         # NestJS — core REST/GraphQL API
├── ai-services/         # Python FastAPI — solver, tutor, validation
├── game-engine/         # Unity — RPG/gamification (Phase 4)
├── infrastructure/      # Terraform + k8s manifests, CI/CD config
├── curriculum-data/     # Lesson content, question banks, metadata
└── docs/                # Planning, architecture, and strategy docs
```

Each top-level directory has its own `README.md` describing scope, status, and how to work inside it.

---

## Documentation

Start here, in this order:

1. [`docs/Preamble.md`](docs/Preamble.md) — original product vision
2. [`docs/Development_Strategy.md`](docs/Development_Strategy.md) — full technical strategy
3. [`docs/MVP_Spec.md`](docs/MVP_Spec.md) — **scoped, executable MVP plan**
4. [`docs/Curriculum_Content_Plan.md`](docs/Curriculum_Content_Plan.md) — how content gets written

---

## Current phase

**Pre-development.** Awaiting decisions listed in `docs/MVP_Spec.md §9` and `docs/Curriculum_Content_Plan.md §11`.
