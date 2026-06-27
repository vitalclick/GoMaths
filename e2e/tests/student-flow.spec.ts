import { expect, test, type Page } from "@playwright/test";
import { installBackendMocks } from "./utils/mock-backend";

test.beforeEach(async ({ page }) => {
  await installBackendMocks(page);
  // Mark onboarding as done so tests land directly on the home screen.
  await page.addInitScript(() => {
    localStorage.setItem("gomaths.onboarding.done", "1");
  });
});

/**
 * Click a tappable element by its accessible name.
 *
 * react-native-web maps Pressables to different roles depending on
 * context: `accessibilityRole="button"` becomes `role="button"`, but
 * the same Pressable wrapped in expo-router's `<Link asChild>` ends up
 * with `role="link"` thanks to Slot's prop merge. The grade-picker
 * uses `accessibilityRole="radio"`. Match all three so the tap works
 * regardless of which wrapping won.
 *
 * The Pressable wrapper is the right click target — clicking the inner
 * Text trips Playwright's visibility check because the Text's bounding
 * box can collapse below the actionability threshold on RN-web.
 */
async function tapByLabel(page: Page, label: string | RegExp): Promise<void> {
  const button = page.getByRole("button", { name: label });
  const link = page.getByRole("link", { name: label });
  const radio = page.getByRole("radio", { name: label });
  await button.or(link).or(radio).first().click();
}

test("happy path: register → topic → lesson → practice → chat with Maya", async ({ page }) => {
  await page.goto("/");

  // Sign-in screen on cold start.
  await expect(page.getByText("GoMaths").first()).toBeVisible();
  await tapByLabel(page, "Create account");

  // Register: step 1 — details. 4 inputs (name, email, password, birth year).
  // Use a birth year that makes the user an adult so we skip the consent step.
  await page.locator("input").nth(0).fill("Test Learner");
  await page.locator("input").nth(1).fill("test@example.com");
  await page.locator("input").nth(2).fill("supersecret");
  await page.locator("input").nth(3).fill("1995");
  await tapByLabel(page, "Next: pick a grade");

  // Step 2 — grade picker. Tap Grade 9 (radio's accessible name is
  // "Grade 9 Senior · pilot grade", so substring match — not an
  // anchored regex — is the right shape here).
  await tapByLabel(page, "Grade 9");
  await tapByLabel(page, "Create account");

  // After register, expo-router does router.replace("/") which updates
  // the URL but on web react-native-screens keeps the /register screen
  // mounted on top of the / screen and never transfers focus — the
  // dashboard's "Howzit, Test Learner" Text is in the DOM but its containing
  // screen has display:none for the full timeout. Waiting on URL alone
  // (previous attempt) didn't help: URL settled to "/" while the stack
  // focus didn't. Force a hard navigation so the dashboard renders from a
  // fresh page; the auth session is persisted in localStorage, so the
  // AuthProvider re-hydrates and we land on the signed-in home directly.
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", {
    timeout: 10_000,
  });
  await page.goto("/");

  // Dashboard appears with the user's name.
  await expect(page.getByText(/Howzit, Test Learner/i).first()).toBeVisible();

  // Browse topics → tap the linear equations topic.
  await tapByLabel(page, "Browse topics");
  await expect(page.getByText("Solving Linear Equations").first()).toBeVisible();
  await tapByLabel(page, "Solving Linear Equations");

  // Lesson screen renders the markdown via WebView/iframe — we can't
  // peek inside; we verify the surrounding chrome instead.
  await expect(page.getByText("You'll be able to").first()).toBeVisible();
  await tapByLabel(page, "Practice this topic");

  // Practice screen shows the first question.
  await expect(page.getByText("2*x + 5 = 13").first()).toBeVisible();
  // "Your answer" is the label rendered as a sibling <Text> above the
  // input; the TextInput's actual placeholder is the example value
  // ("e.g. x = 4") — match on that instead.
  await page.getByPlaceholder(/e\.g\./i).fill("x = 4");
  await tapByLabel(page, "Check answer");
  await expect(page.getByText(/^Correct$/).first()).toBeVisible();
  await tapByLabel(page, "Next question");
  await expect(page.getByText("All done!").first()).toBeVisible();

  // Back to dashboard, into chat. Two goBacks lands on /topics, not /
  // (stack at this point is / → /topics → /topic/<id> → /practice/<id>);
  // navigate to / directly. localStorage keeps the session so the
  // dashboard renders with the same user.
  await page.goto("/");
  await tapByLabel(page, "Chat with Maya");

  // Send a message; verify Maya's reply streams in and the validated badge appears.
  await page.getByPlaceholder(/ask maya anything/i).fill("Why does x equal 4?");
  await tapByLabel(page, "Send");
  await expect(page.getByText(/To solve, x = 4\./i).first()).toBeVisible();
  await expect(page.getByText("Maths verified").first()).toBeVisible();
});
