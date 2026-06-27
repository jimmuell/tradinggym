import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";

const PRO_AUTH_FILE = "e2e/.auth-cross-pro.json";

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

const createUserStrategy = async (page: Page, name: string): Promise<string> => {
  // Always create a fresh user strategy. /strategies has both system (read-only)
  // and user cards; reusing the first card hits a system strategy where Save is
  // hidden. Creation works on this account; the Foundation cap is UI-only.
  await page.goto("/strategies/new");
  await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
  await hideDevOverlay(page);
  await page.locator("input#name").fill(name);

  const selects = page.getByRole("combobox");
  await selects.nth(0).click();
  await page.getByRole("option", { name: "Long", exact: true }).click();
  await selects.nth(1).click();
  await page.getByRole("option", { name: "MES", exact: true }).click();
  await selects.nth(2).click();
  await page.getByRole("option", { name: "5m", exact: true }).click();

  await expandSection(page, "Indicators");
  await page.getByRole("button", { name: /^EMA-9$/ }).first().click();
  await page.getByRole("button", { name: /^VWAP$/ }).first().click();

  await page.getByRole("button", { name: /^Save Strategy$/ }).click();
  await page.waitForURL(/\/strategies\/(?!new)[^/]+$/, { timeout: 15000 });
  return page.url().split("/strategies/")[1];
};

const numericRowInput = (page: Page, labelText: string) =>
  page
    .locator("div.space-y-2")
    .filter({ hasText: labelText })
    .filter({ has: page.locator('input[type="number"]') })
    .first()
    .locator('input[type="number"]')
    .first();

test.describe("Cross-feature integration — Pro plan", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(page, TEST_ACCOUNTS.pro.email, TEST_ACCOUNTS.pro.password);
    proStrategyId = await createUserStrategy(page, `Cross-Feature Test ${Date.now()}`);
    await ctx.storageState({ path: PRO_AUTH_FILE });
    await ctx.close();
  });

  test.use({ storageState: PRO_AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    await hideDevOverlay(page).catch(() => {});
  });

  test("4.1 — New form data triggers playback scenario match", async ({ page }) => {
    // Ensure EMA-9 + VWAP + Long are set on the strategy
    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    // Direction = Long (idempotent)
    const directionSelect = page.getByRole("combobox").nth(0);
    await directionSelect.click();
    await page.getByRole("option", { name: "Long", exact: true }).click();

    await expandSection(page, "Indicators");
    // Click EMA-9 only if not already enabled (border-primary class indicates enabled)
    const emaBtn = page.getByRole("button", { name: /^EMA-9$/ }).first();
    if (!((await emaBtn.getAttribute("class")) ?? "").includes("border-primary")) {
      await emaBtn.click();
    }
    const vwapBtn = page.getByRole("button", { name: /^VWAP$/ }).first();
    if (!((await vwapBtn.getAttribute("class")) ?? "").includes("border-primary")) {
      await vwapBtn.click();
    }

    await page.getByRole("button", { name: /^Save Strategy$/ }).click();
    await expect(page.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    const watchDemo = page.getByRole("button", { name: /Watch Demo/i }).first();
    await expect(watchDemo).toBeVisible();
    await expect(watchDemo).toBeEnabled();
  });

  test("4.2 — Multi-section field values persist across navigation", async ({ page }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    // Entry Method = On Retest
    await expandSection(page, "Entry Method");
    const entrySection = page.locator('[data-state="open"]').filter({ hasText: "Entry Method" });
    await entrySection.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /On Retest/i }).click();

    // Trailing Stop = enabled
    await expandSection(page, "Trailing Stop");
    const trailingToggle = page
      .locator("div", { hasText: /Enable ATR Trailing Stop/ })
      .getByRole("switch")
      .first();
    if ((await trailingToggle.getAttribute("data-state")) !== "checked") {
      await trailingToggle.click();
    }

    // Risk Management: Risk Per Trade = 500, Take Profit (R) = 3
    await expandSection(page, "Risk Management");
    const riskInput = numericRowInput(page, "Risk Per Trade");
    await riskInput.fill("500");
    const tpInput = numericRowInput(page, "Take Profit (R-Multiple)");
    await tpInput.fill("3");

    await page.getByRole("button", { name: /^Save Strategy$/ }).click();
    await expect(page.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

    // Navigate away and back
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    // Verify Entry Method
    await expandSection(page, "Entry Method");
    const entrySectionReloaded = page.locator('[data-state="open"]').filter({ hasText: "Entry Method" });
    await expect(entrySectionReloaded.getByRole("combobox").first()).toContainText(/On Retest/i);

    // Verify Trailing Stop toggle
    await expandSection(page, "Trailing Stop");
    const trailingToggleReloaded = page
      .locator("div", { hasText: /Enable ATR Trailing Stop/ })
      .getByRole("switch")
      .first();
    await expect(trailingToggleReloaded).toHaveAttribute("data-state", "checked");

    // Verify Risk and TP
    await expandSection(page, "Risk Management");
    await expect(numericRowInput(page, "Risk Per Trade")).toHaveValue("500");
    await expect(numericRowInput(page, "Take Profit (R-Multiple)")).toHaveValue("3");
  });

  test("4.3 — Indicator save and reload preserves EMA-9", async ({ page }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await expandSection(page, "Indicators");
    const emaBtn = page.getByRole("button", { name: /^EMA-9$/ }).first();
    if (!((await emaBtn.getAttribute("class")) ?? "").includes("border-primary")) {
      await emaBtn.click();
    }
    await page.getByRole("button", { name: /^Save Strategy$/ }).click();
    await expect(page.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);
    await expandSection(page, "Indicators");
    const emaBtnReloaded = page.getByRole("button", { name: /^EMA-9$/ }).first();
    await expect(emaBtnReloaded).toHaveClass(/border-primary/);
  });

  test("4.4 — Direction bias 'Long' persists with correct casing", async ({ page }) => {
    await page.goto(`/strategies/${proStrategyId}`);
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);

    await page.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Long", exact: true }).click();
    await page.getByRole("button", { name: /^Save Strategy$/ }).click();
    await expect(page.getByText("Strategy saved").first()).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.getByRole("button", { name: /Strategy Identity/i }).waitFor({ state: "visible", timeout: 15000 });
    await hideDevOverlay(page);
    await expect(page.getByRole("combobox").nth(0)).toContainText(/^Long$/);
  });

  test("4.5 — Landing → Start Free navigates to /auth", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: /start free/i }).first().click();
    await page.waitForURL(/\/auth/, { timeout: 10000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await ctx.close();
  });

  test("4.6 — Sidebar shows Trade / Learn / Account groups with expected items", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    const sidebar = page.locator('[data-sidebar="sidebar"]').first();
    await expect(sidebar.getByText("Trade", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Learn", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Account", { exact: true })).toBeVisible();

    for (const item of ["Dashboard", "Simulator", "Strategies", "Analytics"]) {
      await expect(sidebar.getByRole("link", { name: new RegExp(`^${item}$`) }).first()).toBeVisible();
    }
    for (const item of ["Learning", "Classes", "Resources"]) {
      await expect(sidebar.getByRole("link", { name: new RegExp(`^${item}$`) }).first()).toBeVisible();
    }
    for (const item of ["Settings", "Profile"]) {
      await expect(sidebar.getByRole("link", { name: new RegExp(`^${item}$`) }).first()).toBeVisible();
    }
  });

  test("4.7 — Companion launch button is clickable on dashboard", async ({ page, context }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await hideDevOverlay(page);

    const launchBtn = page.getByRole("button", { name: /(launch|resume)\s*session/i }).first();
    await expect(launchBtn).toBeVisible();
    await expect(launchBtn).toBeEnabled();

    // window.open opens a popup; we don't assert popup contents, just no crash
    const popupPromise = context.waitForEvent("page", { timeout: 5000 }).catch(() => null);
    await launchBtn.click();
    const popup = await popupPromise;
    if (popup) await popup.close().catch(() => {});

    // Page is still alive after click
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
