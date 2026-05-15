# @gomaths/api-client

Typed API client consumed by every app.

## How it's built
- OpenAPI spec is the source of truth, lives in `services/backend-api/openapi.yaml`
- Client generated via `openapi-typescript` + a thin React Query wrapper
- Regenerated in CI on every backend change; PR fails if any app has type errors

## What lives here
- Generated types
- Fetch helpers with auth/refresh handling
- React Query hooks (`useCurrentUser`, `useCurriculum`, `useTutorMessage`, etc.)
- Error normalization

## What does NOT live here
- Business logic (belongs in apps or domain packages)
- UI (belongs in `@gomaths/ui`)
