# @gomaths/types

Shared domain types — entities, enums, and DTOs used across apps, services, and content tooling.

## What lives here
- `User`, `Student`, `Parent`, `Teacher`, `School` shapes
- `Grade`, `Topic`, `Lesson`, `Question` curriculum shapes
- `ProgressEvent`, `MasteryScore`
- Enums (roles, content areas, difficulty levels)

## What does NOT live here
- API response shapes that are generated from OpenAPI (those live in `@gomaths/api-client`)
- Backend-only types (live in `services/backend-api`)
