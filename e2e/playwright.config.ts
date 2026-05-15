import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the GoMaths Student web build.
 *
 * The default `webServer` block boots the Expo Web build before running
 * tests. Override `STUDENT_BASE_URL` to point at a deployed environment
 * (staging) instead.
 *
 * The AI / backend layer is mocked at the network boundary inside each
 * test (see `tests/utils/mock-backend.ts`), so the suite has no
 * external dependencies.
 */
const baseURL = process.env.STUDENT_BASE_URL ?? "http://localhost:8081";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.STUDENT_BASE_URL
    ? undefined
    : {
        // EXPO_PUBLIC_API_URL points at a domain that route-handlers
        // intercept — no real backend is reached.
        command:
          "EXPO_PUBLIC_API_URL=http://e2e.gomaths.local pnpm --filter @gomaths/student web",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
