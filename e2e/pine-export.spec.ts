import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";

const PRO_AUTH_FILE = "e2e/.auth-pine-pro.json";
const STARTER_AUTH_FILE = "e2e/.auth-pine-starter.json";

let proStrategyId: string | null = null;

const hideDevOverlay = (page: Page) =>
  page.addStyleTag({
    content:
      ".bg-slate-900.border-slate-700.rounded-2xl.shadow-lg { display: none !important; }",
  });

const createTestStrategy = async (page: Page, name: string) => {
  await page.goto("/strategies/new");
  await page
    .getByRole("button", { name: /Strategy Identity/i })
    .waitFor({ state: "visible", timeout: 15000 });
  await hideDevOverlay(page);

  await page.locator("input#name").fill(name);

  const selects = page.getByRole("combobox");
  await selects.nth(0).click();
  await page.getByRole("option", { name: "Long", exact: true }).click();
  await selects.nth(1).click();
  await page.getByRole("option", { name: "MES", exact: true }).click();
  await selects.nth(2).click();
  await page.getByRole("option", { name: "5m", exact: true }).click();

  await page.getByRole("button", { name: /^Save Strategy$/ }).click();
  await page.waitForURL(/\/strategies\/(?!new)[^/]+$/, { timeout: 15000 });
  return page.url().split("/strategies/")[1];
};

test.describe("Pine Script Export — Pro plan", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(page, TEST_ACCOUNTS.pro.email, TEST_ACCOUNTS.pro.password);
    proStrategyId = await createTestStrategy(page, "Pine Export Test");
    await ctx.storageState({ path: PRO_AUTH_FILE });
    await ctx.close();
  });

  test.use({
    storageState: PRO_AUTH_FILE,
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test.beforeEach(async ({ page }) => {
    await hideDevOverlay(page).catch(() => {});
  });

  test("7.1 — Export icon button visible on a strategy card", async ({
    page,
  }) => {
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    const exportButton = page
      .getByRole("button", { name: /Export to Pine Script/i })
      .first();
    await expect(exportButton).toBeVisible();
  });

  test("7.2 — Export button visible on saved strategy detail", async ({
    page,
  }) => {
    expect(proStrategyId).toBeTruthy();
    await page.goto(`/strategies/${proStrategyId}`);
    await hideDevOverlay(page);

    await expect(
      page.getByRole("button", { name: /Export to Pine Script/i }).first(),
    ).toBeVisible();
  });

  test("7.3 — Export button NOT visible on /strategies/new", async ({
    page,
  }) => {
    await page.goto("/strategies/new");
    await page
      .getByRole("button", { name: /Strategy Identity/i })
      .waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await expect(
      page.getByRole("button", { name: /Export to Pine Script/i }),
    ).toHaveCount(0);
  });

  test("7.4 — Modal opens with name, badge, code preview, line numbers", async ({
    page,
  }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await hideDevOverlay(page);

    await page
      .getByRole("button", { name: /Export to Pine Script/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Pine Export Test").first()).toBeVisible();
    await expect(dialog.getByText("Pine Script v5")).toBeVisible();
    await expect(dialog.locator("table td").filter({ hasText: /^1$/ }).first())
      .toBeVisible();
    await expect(dialog.locator("table td").filter({ hasText: /^2$/ }).first())
      .toBeVisible();
  });

  test("7.5 — Code preview contains valid Pine Script v5 markers", async ({
    page,
  }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await hideDevOverlay(page);

    await page
      .getByRole("button", { name: /Export to Pine Script/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const codeText = await dialog.locator("table").innerText();
    expect(codeText).toContain("//@version=5");
    expect(codeText).toContain("indicator(");
  });

  test("7.6 — Copy to Clipboard shows success toast", async ({ page }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await hideDevOverlay(page);

    await page
      .getByRole("button", { name: /Export to Pine Script/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page
      .getByRole("button", { name: /Copy to Clipboard/i })
      .click();

    await expect(page.getByText(/copied to clipboard/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("7.7 — Download .pine triggers a download", async ({ page }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await hideDevOverlay(page);

    await page
      .getByRole("button", { name: /Export to Pine Script/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByRole("button", { name: /Download \.pine/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pine$/);
  });

  test("7.8 — Instructions panel expands and mentions Pine Editor", async ({
    page,
  }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await hideDevOverlay(page);

    await page
      .getByRole("button", { name: /Export to Pine Script/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const trigger = page.getByRole("button", {
      name: /How to use this in TradingView/i,
    });
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page.getByText(/Pine Editor/i).first()).toBeVisible();
  });
});

test.describe("Pine Script Export — Starter plan (locked)", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(
      page,
      TEST_ACCOUNTS.starter.email,
      TEST_ACCOUNTS.starter.password,
    );

    // Ensure starter has at least one user strategy on /strategies so the
    // export button is visible. Foundation tier caps at 1, but we create
    // unconditionally — if save fails we'll see it in beforeAll.
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const existingExport = await page
      .getByRole("button", { name: /Export to Pine Script/i })
      .count();
    if (existingExport === 0) {
      await createTestStrategy(page, "Pine Export Test");
    }

    await ctx.storageState({ path: STARTER_AUTH_FILE });
    await ctx.close();
  });

  test.use({ storageState: STARTER_AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    await hideDevOverlay(page).catch(() => {});
  });

  test("7.9 — Starter sees upgrade gate instead of export modal", async ({
    page,
  }) => {
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    await page
      .getByRole("button", { name: /Export to Pine Script/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/upgrade.*pro/i).first()).toBeVisible();
  });
});
