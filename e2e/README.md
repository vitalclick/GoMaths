# @gomaths/e2e

End-to-end tests for the GoMaths Student app, running against the
Expo Web build via Playwright.

## What it covers

A single happy-path spec walks the full Phase 1 student flow:

1. Register a new account
2. Land on the dashboard
3. Browse Grade 9 topics
4. Open the lesson view
5. Tap "Practice", answer one question correctly, see the "Correct" feedback, move to the "All done!" screen
6. Open the AI tutor, send a message, see Maya's streamed reply and the "Maths verified" badge

The backend layer is mocked at the network boundary (Playwright route
interception). Service / unit tests already cover backend behaviour;
this suite confirms the app _uses_ it correctly.

## Running

```sh
pnpm --filter @gomaths/e2e test
```

The `webServer` block in `playwright.config.ts` boots
`pnpm --filter @gomaths/student web` automatically.

To target a deployed environment instead:

```sh
STUDENT_BASE_URL=https://student.staging.gomaths.co.za \
  pnpm --filter @gomaths/e2e test
```

## Adding tests

Spec files live in `tests/`. Use `installBackendMocks(page)` in a
`beforeEach` to set up the canned API responses; override individual
routes inside a single test if a different shape is needed.
