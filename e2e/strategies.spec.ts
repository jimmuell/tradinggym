import { test, expect } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL ?? "";
const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "";

test.describe("Strategy CRUD lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  const strategyName = `E2E Test Strategy ${Date.now()}`;
  const renamedName = `E2E Renamed ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60000);
    const page = await browser.newPage();
    await page.goto("/auth");

    // If already authenticated, the auth page redirects to /dashboard.
    // Wait for either the login form OR a post-login page.
    const loginForm = page.getByText("Welcome back");
    const dashboard = page.getByRole("heading", { name: /dashboard/i });
    const landed = await Promise.race([
      loginForm.waitFor({ state: "visible", timeout: 15000 }).then(() => "auth" as const),
      dashboard.waitFor({ state: "visible", timeout: 15000 }).then(() => "dashboard" as const),
      page.waitForURL(/\/(dashboard|strategies|simulator)/, { timeout: 15000 }).then(() => "redirected" as const),
    ]);

    if (landed === "auth") {
      // Not logged in — perform login
      await page
        .getByRole("textbox", { name: "you@example.com" })
        .fill(testEmail);
      await page.locator('input[type="password"]').fill(testPassword);
      await page.getByRole("button", { name: /log in/i }).click();
      await page.waitForURL(/\/(dashboard|strategies|simulator)/, {
        timeout: 30000,
      });
    }
    // else: already logged in, just save the state

    await page.context().storageState({ path: "e2e/.auth.json" });
    await page.close();
  });

  test.use({ storageState: "e2e/.auth.json" });

  test("create a strategy and verify it appears in My Strategies", async ({
    page,
  }) => {
    await page.goto("/strategies");
    await page.getByText("TradingGYM Strategies").waitFor({ state: "visible" });

    await page.getByRole("button", { name: /New Strategy/i }).click();
    await page.waitForURL("**/strategies/new");

    await page.getByPlaceholder("Strategy name").fill(strategyName);
    await page.getByRole("button", { name: /Save/i }).click();

    await page.waitForURL(/\/strategies\/(?!new).+/);

    await page.goto("/strategies");
    await page.getByText("TradingGYM Strategies").waitFor({ state: "visible" });

    await expect(page.getByText(strategyName)).toBeVisible();
  });

  test("edit the strategy name and verify persistence", async ({ page }) => {
    await page.goto("/strategies");
    await page.getByText("TradingGYM Strategies").waitFor({ state: "visible" });

    await page.getByText(strategyName).click();
    await page.waitForURL(/\/strategies\/(?!new).+/);

    const nameInput = page.getByPlaceholder("Strategy name");
    await nameInput.clear();
    await nameInput.fill(renamedName);

    await page.getByRole("button", { name: /Save/i }).click();
    await expect(
      page.getByText("Strategy saved", { exact: true }).first(),
    ).toBeVisible();

    await page.reload();
    await page.getByPlaceholder("Strategy name").waitFor({ state: "visible" });
    await expect(page.getByPlaceholder("Strategy name")).toHaveValue(
      renamedName,
    );
  });

  test("delete the strategy and verify removal", async ({ page }) => {
    await page.goto("/strategies");
    await page.getByText("TradingGYM Strategies").waitFor({ state: "visible" });

    await page.getByText(renamedName).click();
    await page.waitForURL(/\/strategies\/(?!new).+/);

    // Click the red trash icon button (icon-only, no text)
    await page.getByRole("button").filter({ hasText: /^$/ }).last().click();

    // Confirm in the dialog
    await page.getByRole("button", { name: /delete/i }).click();

    await page.waitForURL("**/strategies");
    await expect(page.getByText(renamedName)).not.toBeVisible();
  });
});
