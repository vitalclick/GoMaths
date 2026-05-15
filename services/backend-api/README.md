# backend-api

NestJS service — core REST/GraphQL API for GoMaths.

## Responsibilities (MVP)
- Authentication & session management (JWT + refresh tokens)
- User profiles (Student only at MVP)
- Curriculum serving (reads from `curriculum-data/` at build/deploy)
- Progress events ingestion + summary queries
- Proxies AI requests to `ai-services/` (the mobile app never calls AI services directly)

## Stack
- NestJS + TypeScript
- PostgreSQL (primary store)
- Redis (cache, session, rate-limit)
- Prisma or TypeORM (decision deferred — recommendation: Prisma)
- BullMQ (background jobs)

## API surface (MVP)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/users/me
GET    /api/curriculum/grades/:grade
GET    /api/curriculum/topics/:topicId
GET    /api/curriculum/topics/:topicId/questions
POST   /api/progress/events
GET    /api/progress/summary
POST   /api/tutor/messages        # proxies to ai-services
POST   /api/solver/scan           # proxies to ai-services
```

## Status
Not yet scaffolded. Initialise with `nest new backend-api` after MVP kickoff.

## Data residency
All deployments in AWS af-south-1 (POPIA).
