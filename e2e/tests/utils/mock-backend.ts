/**
 * Mock the GoMaths backend at the Playwright route layer so the E2E
 * suite has no external dependencies. We match against any request to
 * `http://e2e.gomaths.local/**` (set as EXPO_PUBLIC_API_URL by the
 * Playwright config) and return canned bodies.
 *
 * The point isn't to exercise the backend — the unit + service tests
 * cover that. The point is to confirm that the Student app, given a
 * well-behaved backend, walks the user from sign-in → topic → quiz
 * → chat with the right UI states.
 */

import type { Page } from "@playwright/test";

const BASE = "http://e2e.gomaths.local";

const FAKE_SESSION = {
  accessToken: "test-access-token",
  refreshToken: "test-refresh-token",
  expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  user: {
    id: "stu-test-1",
    email: "test@example.com",
    role: "student",
    language: "en",
    displayName: "Test Learner",
    grade: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const TOPICS = [
  {
    topicId: "g9.alg.linear-eq",
    title: "Solving Linear Equations",
    grade: 9,
    contentArea: "patterns_functions_algebra",
    capsReference: "Term 2, Topic 2.3",
    estimatedMinutes: 25,
  },
];

const TOPIC_DETAIL = {
  ...TOPICS[0],
  prerequisites: [],
  learningOutcomes: ["Solve linear equations of the form ax + b = c"],
  lessonMarkdown: "# Solving Linear Equations\n\nA **linear equation**…",
};

const QUESTIONS = [
  {
    id: "g9.alg.linear-eq.q001",
    topicId: "g9.alg.linear-eq",
    difficulty: "easy",
    stem: "2*x + 5 = 13",
    answer: "x = 4",
    answerLatex: "x = 4",
    solutionSteps: ["Subtract 5: 2x = 8", "Divide by 2: x = 4"],
    commonMistakes: [],
    tags: [],
  },
];

export async function installBackendMocks(page: Page) {
  // Auth.
  await page.route(`${BASE}/api/auth/register`, (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(FAKE_SESSION),
    }),
  );
  await page.route(`${BASE}/api/auth/login`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FAKE_SESSION),
    }),
  );

  // Curriculum.
  await page.route(`${BASE}/api/curriculum/grades/9`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(TOPICS),
    }),
  );
  await page.route(`${BASE}/api/curriculum/topics/g9.alg.linear-eq`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(TOPIC_DETAIL),
    }),
  );
  await page.route(`${BASE}/api/curriculum/topics/g9.alg.linear-eq/questions`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(QUESTIONS),
    }),
  );

  // Answer check.
  await page.route(`${BASE}/api/curriculum/check`, async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as {
      questionId: string;
      answer: string;
    };
    const correct = body.answer.replace(/\s+/g, "") === "x=4";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        questionId: body.questionId,
        correct,
        validated: true,
        expected: "x = 4",
      }),
    });
  });

  // Tutor stream — emits a meta + two delta + done as an SSE response.
  await page.route(`${BASE}/api/tutor/messages/stream`, (route) => {
    const sse = [
      `event: meta\ndata: {"conversationId":"conv_e2e"}\n\n`,
      `event: delta\ndata: {"text":"Sure! "}\n\n`,
      `event: delta\ndata: {"text":"To solve, x = 4."}\n\n`,
      `event: claim\ndata: {"raw":"x = 4","stem":"x","answer":"4","ok":true}\n\n`,
      `event: done\ndata: {"reply":"Sure! To solve, x = 4.","validated":true,"input_tokens":120,"output_tokens":42,"cached_tokens":110,"provider":"mock","model":"mock-1"}\n\n`,
    ].join("");
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: sse,
    });
  });

  // Notifications + progress endpoints — accept and ignore.
  await page.route(`${BASE}/api/notifications/tokens`, (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  await page.route(`${BASE}/api/progress/events`, (route) =>
    route.fulfill({ status: 202, body: "{}" }),
  );
  await page.route(`${BASE}/api/progress/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        studentId: "stu-test-1",
        generatedAt: new Date().toISOString(),
        mastery: [],
      }),
    }),
  );
}
