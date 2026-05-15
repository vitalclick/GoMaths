# @gomaths/api-client

Typed HTTP client for the GoMaths backend.

## Generation

The client is generated from `services/backend-api/openapi.yaml` via
`openapi-typescript`. Whenever you change the OpenAPI spec:

```sh
pnpm --filter @gomaths/api-client generate
git add packages/api-client/src/generated.ts
```

CI fails if `generated.ts` is out of date with the spec, so you'll
catch a missed regeneration before merge.

## Usage

```ts
import { createClient } from "@gomaths/api-client";

const api = createClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  getAccessToken: () => storage.getItem("gomaths.access"),
});

const { data, error } = await api.GET("/api/curriculum/grades/{grade}", {
  params: { path: { grade: 9 } },
});
```

`data` and `error` are typed from the OpenAPI spec — switching on them
narrows correctly without manual type assertions.

The wrapper is built on
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/), a thin
(~1KB) shim over the platform `fetch`. No React dependency, so the
client works in apps, services, and Node scripts.

## Streaming

The SSE endpoint (`POST /api/tutor/messages/stream`) returns
`text/event-stream` — outside `openapi-fetch`'s JSON expectations.
Apps continue to use a dedicated SSE client (e.g. `react-native-sse`)
for that route. See `apps/student/lib/tutor.ts:streamTutorMessage`.
