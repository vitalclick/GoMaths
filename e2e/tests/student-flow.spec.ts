import { expect, test } from "@playwright/test";
import { installBackendMocks } from "./utils/mock-backend";

test.beforeEach(async ({ page }) => {
  await installBackendMocks(page);
});

test("happy path: register → topic → lesson → practice → chat with Maya", async ({ page }) => {
  await page.goto("/");

  // Sign-in screen on cold start.
  await expect(page.getByText("GoMaths")).toBeVisible();
  await page.getByRole("button", { name: /create account/i }).click();

  // Register form.
  await page.getByText(/your name/i).click();
  await page.locator('input').nth(0).fill("Test Learner");
  await page.locator('input').nth(1).fill("test@example.com");
  await page.locator('input').nth(2).fill("supersecret");
  // Grade default is 9 — leave it.
  await page.getByRole("button", { name: /^create account$/i }).click();

  // Dashboard appears with the user's name.
  await expect(page.getByText(/Hi, Test Learner/i)).toBeVisible();

  // Browse topics → tap the linear equations topic.
  await page.getByRole("button", { name: /browse topics/i }).click();
  await expect(page.getByText("Solving Linear Equations")).toBeVisible();
  await page.getByText("Solving Linear Equations").click();

  // Lesson screen renders the markdown via WebView/iframe — we can't
  // peek inside; we verify the surrounding chrome instead.
  await expect(page.getByText("You'll be able to")).toBeVisible();
  await page.getByRole("button", { name: /practice this topic/i }).click();

  // Practice screen shows the first question.
  await expect(page.getByText("2*x + 5 = 13")).toBeVisible();
  await page.getByPlaceholder(/your answer/i).fill("x = 4");
  await page.getByRole("button", { name: /check answer/i }).click();
  await expect(page.getByText(/^Correct$/)).toBeVisible();
  await page.getByRole("button", { name: /next question/i }).click();
  await expect(page.getByText("All done!")).toBeVisible();

  // Back to dashboard, into chat.
  await page.goBack();
  await page.goBack();
  await page.getByRole("button", { name: /chat with maya/i }).click();

  // Send a message; verify Maya's reply streams in and the validated badge appears.
  await page.getByPlaceholder(/ask maya anything/i).fill("Why does x equal 4?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/To solve, x = 4\./i)).toBeVisible();
  await expect(page.getByText("Maths verified")).toBeVisible();
});
