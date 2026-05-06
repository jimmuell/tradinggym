import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";

const PRO_AUTH_FILE = "e2e/.auth-edge-pro.json";

let proStrategyId: string | null = null;

const hideDevOverlay = (page: Page) =>
  page.addStyleTag({
    content:
      ".bg-slate-900.border-slate-700.rounded-2xl.shadow-lg { display: none !important; }",
  });

const expandSection = async (page: Page, title: string) => {
  const trigger = page.getByRole("button", { name: new RegExp(title, "i") }).first();
  const state = await trigger.getAttribute("data-state");
  if (state !== "open") await trigger.click();
};

const numericRowInput = (page: Page, labelText: string) =>
  page
    .locator("div.space-y-2")
    .filter({ hasText: labelText })
    .filter({ has: page.locator('input[type="number"]') })
    .first()
    .locator('input[type="number"]')
    .first();

const createUserStrategy = async (page: Page, name: string): Promise<string> => {
  await page.goto("/strategies/new");
  await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
  await hideDevOverlay(page);
  await page.locator("input#name").fill(name);
  await page.getByRole("button", { name: /^Save Strategy$/ }).click();
  await page.waitForURL(/\/strategies\/(?!new)[^/]+$/, { timeout: 15000 });
  return page.url().split("/strategies/")[1];
};

const countUserStrategyCards = async (page: Page) => {
  await page.goto("/strategies");
  await page.waitForLoadState("networkidle");
  return await page.getByRole("button", { name: /Watch Demo/i }).count();
};

test.describe("Edge cases — Pro plan", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(page, TEST_ACCOUNTS.pro.email, TEST_ACCOUNTS.pro.password);
    proStrategyId = await createUserStrategy(page, `Edge Cases Test ${Date.now()}`);
    await ctx.storageState({ path: PRO_AUTH_FILE });
    await ctx.close();
  });

  test.use({ storageState: PRO_AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    await hideDevOverlay(page).catch(() => {});
  });

  test("6.1 — Strategy with only the name and defaults saves and reloads", async ({ page }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await page.getByRole("button", { name: /Reset to Defaults/i }).click();
    await page.getByRole("button", { name: /^Reset$/ }).click();

    await page.locator("input#name").fill("Empty Test");
    await page.getByRole("button", { name: /^Save Strategy$/ }).click();
    await expect(page.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await expect(page.locator("input#name")).toHaveValue("Empty Test");
    await expect(page.getByRole("combobox").nth(1)).toContainText("MES");
    await expect(page.getByRole("combobox").nth(2)).toContainText("5m");
  });

  test("6.2 — Large numeric values persist", async ({ page }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await expandSection(page, "Risk Management");
    await numericRowInput(page, "Risk Per Trade").fill("99999");
    await numericRowInput(page, "Stop Loss (ticks)").fill("99999");
    await numericRowInput(page, "Take Profit (R-Multiple)").fill("99999");

    await page.getByRole("button", { name: /^Save Strategy$/ }).click();
    await expect(page.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);
    await expandSection(page, "Risk Management");

    await expect(numericRowInput(page, "Risk Per Trade")).toHaveValue("99999");
    await expect(numericRowInput(page, "Stop Loss (ticks)")).toHaveValue("99999");
    await expect(numericRowInput(page, "Take Profit (R-Multiple)")).toHaveValue("99999");
  });

  test("6.4 — Multiple strategies load independently (skips if only one)", async ({ page }) => {
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    const viewDetailsCount = await page.getByRole("button", { name: /View Details/i }).count();
    test.skip(viewDetailsCount < 2, `Only ${viewDetailsCount} strategy card with View Details present`);

    await page.getByRole("button", { name: /View Details/i }).nth(0).click();
    await page.waitForURL(/\/strategies\/(?!new)[^/]+$/, { timeout: 10000 });
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    const firstName = await page.locator("input#name").inputValue();

    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    await page.getByRole("button", { name: /View Details/i }).nth(1).click();
    await page.waitForURL(/\/strategies\/(?!new)[^/]+$/, { timeout: 10000 });
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    const secondName = await page.locator("input#name").inputValue();

    expect(secondName).not.toBe(firstName);
  });

  test("6.5 — Browser refresh on /strategies/new clears unsaved name", async ({ page }) => {
    await page.goto("/strategies/new");
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await page.locator("input#name").fill("Refresh Test");
    await expect(page.locator("input#name")).toHaveValue("Refresh Test");

    await page.reload();
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await expect(page.locator("input#name")).toHaveValue("");
  });

  test("6.6 — Concurrent edits: last write wins, no crash", async ({ browser }) => {
    expect(proStrategyId).toBeTruthy();
    const ctxA = await browser.newContext({ storageState: PRO_AUTH_FILE });
    const ctxB = await browser.newContext({ storageState: PRO_AUTH_FILE });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      await pageA.goto(`/strategies/${proStrategyId}`);
      await pageA.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
      await hideDevOverlay(pageA);

      await pageB.goto(`/strategies/${proStrategyId}`);
      await pageB.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
      await hideDevOverlay(pageB);

      await pageA.locator("input#name").fill("Context A Edit");
      await pageA.getByRole("button", { name: /^Save Strategy$/ }).click();
      await expect(pageA.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

      await pageB.locator("input#name").fill("Context B Edit");
      await pageB.getByRole("button", { name: /^Save Strategy$/ }).click();
      await expect(pageB.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

      await pageA.reload();
      await pageA.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
      await hideDevOverlay(pageA);
      await expect(pageA.locator("input#name")).toHaveValue("Context B Edit");
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test("6.3 — Strategy delete removes the card", async ({ page }) => {
    const beforeCount = await countUserStrategyCards(page);
    test.skip(beforeCount < 1, "No user strategies to delete");

    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await page.locator('button[class*="bg-destructive"]').first().click();
    await page.getByRole("button", { name: /^Delete$/ }).click();

    await page.waitForURL("**/strategies", { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const afterCount = await countUserStrategyCards(page);
    expect(afterCount).toBe(beforeCount - 1);
  });
});
