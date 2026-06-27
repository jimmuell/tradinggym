import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";

const PRO_AUTH_FILE = "e2e/.auth-pro.json";
const STARTER_AUTH_FILE = "e2e/.auth-starter.json";

const SECTION_TITLES = [
  "Strategy Identity",
  "Time Settings",
  "Indicators",
  "Entry Method",
  "Risk Management",
  "Trailing Stop",
  "Trade Frequency Limits",
  "High Probability Filters",
];

const sectionTrigger = (page: Page, title: string) =>
  page.getByRole("button", { name: new RegExp(title, "i") }).first();

const expandSection = async (page: Page, title: string) => {
  const trigger = sectionTrigger(page, title);
  const state = await trigger.getAttribute("data-state");
  if (state !== "open") {
    await trigger.click();
  }
};

const gotoNewStrategy = async (page: Page) => {
  await page.goto("/strategies/new");
  await page
    .getByRole("button", { name: /Strategy Identity/i })
    .waitFor({ state: "visible", timeout: 15000 });
  // Dev-only floating tier switcher (position: fixed) intercepts pointer events
  // on the form footer. Hide it for every test in this spec.
  await page.addStyleTag({
    content:
      ".bg-slate-900.border-slate-700.rounded-2xl.shadow-lg { display: none !important; }",
  });
};

test.describe("Strategy form — Pro plan (full access)", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(page, TEST_ACCOUNTS.pro.email, TEST_ACCOUNTS.pro.password);
    await ctx.storageState({ path: PRO_AUTH_FILE });
    await ctx.close();
  });

  test.use({ storageState: PRO_AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    await gotoNewStrategy(page);
  });

  test("2.1 — accordion renders 8 sections with icons and configured pills", async ({
    page,
  }) => {
    for (const title of SECTION_TITLES) {
      const trigger = sectionTrigger(page, title);
      await expect(trigger).toBeVisible();
      await expect(trigger).toContainText(/of \d+ configured/);
    }
  });

  test("2.2 — Strategy Identity is expanded by default; others collapsed", async ({
    page,
  }) => {
    await expect(sectionTrigger(page, "Strategy Identity")).toHaveAttribute(
      "data-state",
      "open",
    );
    for (const title of SECTION_TITLES.slice(1)) {
      await expect(sectionTrigger(page, title)).toHaveAttribute(
        "data-state",
        "closed",
      );
    }
  });

  test("2.3 — every section header has an icon", async ({ page }) => {
    for (const title of SECTION_TITLES) {
      const trigger = sectionTrigger(page, title);
      await expect(trigger.locator("svg").first()).toBeVisible();
    }
  });

  test("2.4 — Identity fields accept input", async ({ page }) => {
    await page.locator("input#name").fill("Test ORB");
    await expect(page.locator("input#name")).toHaveValue("Test ORB");

    const selects = page.getByRole("combobox");
    await selects.nth(0).click();
    await page.getByRole("option", { name: "Long", exact: true }).click();
    await expect(selects.nth(0)).toContainText("Long");

    await selects.nth(1).click();
    await page.getByRole("option", { name: "MES", exact: true }).click();
    await expect(selects.nth(1)).toContainText("MES");

    await selects.nth(2).click();
    await page.getByRole("option", { name: "5m", exact: true }).click();
    await expect(selects.nth(2)).toContainText("5m");
  });

  test("2.5 — Time Settings exposes H/M/S and H/M pickers", async ({ page }) => {
    await expandSection(page, "Time Settings");

    const rangeStartRow = page
      .locator("div.rounded-md.border")
      .filter({ hasText: "Range Start" })
      .first();
    await expect(rangeStartRow.locator("input[type=number]")).toHaveCount(3);

    const tradeStartRow = page
      .locator("div.rounded-md.border")
      .filter({ hasText: "Trade Start" })
      .first();
    await expect(tradeStartRow.locator("input[type=number]")).toHaveCount(2);
  });

  test("2.6 — Indicator grid groups Trend / Momentum / Volatility", async ({
    page,
  }) => {
    await expandSection(page, "Indicators");
    await expect(page.getByText("Trend", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Momentum", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Volatility", { exact: true }).first(),
    ).toBeVisible();
  });

  test("2.7 — enabling EMA-9 highlights it and reveals settings", async ({
    page,
  }) => {
    await expandSection(page, "Indicators");
    const emaButton = page.getByRole("button", { name: /^EMA-9$/ }).first();
    await emaButton.click();
    await expect(emaButton).toHaveClass(/border-primary/);
    await expect(page.getByText(/EMA-9 settings/i)).toBeVisible();
  });

  test("2.8 — Entry Method 'On Retest' reveals retest fields", async ({
    page,
  }) => {
    await expandSection(page, "Entry Method");
    const entrySection = page
      .locator('[data-state="open"]')
      .filter({ hasText: "Entry Method" });
    const entrySelect = entrySection.getByRole("combobox").first();
    await entrySelect.click();
    await page.getByRole("option", { name: /On Retest/i }).click();

    await expect(page.getByText("Retest Entry Type")).toBeVisible();
    await expect(page.getByText(/Limit Order Placement/i)).toBeVisible();
    await expect(page.getByText("Retest Stop Method")).toBeVisible();
    await expect(page.getByText(/% of Range Stop Loss/i)).toBeVisible();
    await expect(page.getByText(/Breakout % Threshold/i)).toBeVisible();
  });

  test("2.9 — switching to On Close hides retest, shows breakout candle SL", async ({
    page,
  }) => {
    await expandSection(page, "Entry Method");
    const entrySection = page
      .locator('[data-state="open"]')
      .filter({ hasText: "Entry Method" });
    const entrySelect = entrySection.getByRole("combobox").first();

    await entrySelect.click();
    await page.getByRole("option", { name: /On Retest/i }).click();
    await expect(page.getByText("Retest Entry Type")).toBeVisible();

    await entrySelect.click();
    await page.getByRole("option", { name: /On Close/i }).click();

    await expect(page.getByText("Retest Entry Type")).toHaveCount(0);
    await expect(
      page.getByText(/Use Breakout Candle as Stop Loss/i),
    ).toBeVisible();
  });

  test("2.10 — Trailing Stop toggle reveals/hides ATR fields", async ({
    page,
  }) => {
    await expandSection(page, "Trailing Stop");
    const toggle = page
      .locator("div", { hasText: /Enable ATR Trailing Stop/ })
      .getByRole("switch")
      .first();

    await toggle.click();
    await expect(page.getByText(/Activate Trailing at \(R\)/i)).toBeVisible();
    await expect(page.getByText(/ATR Length/i)).toBeVisible();
    await expect(page.getByText(/ATR Multiplier/i)).toBeVisible();
    await expect(page.getByText(/ATR Timeframe/i)).toBeVisible();

    await toggle.click();
    await expect(page.getByText(/Activate Trailing at \(R\)/i)).toHaveCount(0);
  });

  test("2.11 — info tooltip appears on hover", async ({ page }) => {
    const infoButton = page
      .getByRole("button", { name: /^info$/i })
      .first();
    await infoButton.hover();
    await expect(page.getByRole("tooltip").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("2.12 — save strategy succeeds with required fields", async ({
    page,
  }) => {
    const name = `Pro E2E ${Date.now()}`;
    await page.locator("input#name").fill(name);
    await page.getByRole("button", { name: /^Save Strategy$/i }).click();
    await expect(page.getByText("Strategy saved").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("2.13 — Reset to Defaults shows confirmation and clears fields", async ({
    page,
  }) => {
    await page.locator("input#name").fill("Will be kept");
    await expandSection(page, "Indicators");
    await page.getByRole("button", { name: /^EMA-9$/ }).first().click();

    await page.getByRole("button", { name: /Reset to Defaults/i }).click();
    await expect(page.getByText(/Reset all fields to defaults/i)).toBeVisible();
    await page.getByRole("button", { name: /^Reset$/ }).click();

    await expect(page.getByText(/EMA-9 settings/i)).toHaveCount(0);
  });
});

test.describe("Strategy form — Starter plan (locked sections)", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    await login(
      page,
      TEST_ACCOUNTS.starter.email,
      TEST_ACCOUNTS.starter.password,
    );
    await ctx.storageState({ path: STARTER_AUTH_FILE });
    await ctx.close();
  });

  test.use({ storageState: STARTER_AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    await gotoNewStrategy(page);
  });

  test("2.14 — Time Settings shows blur overlay with upgrade CTA", async ({
    page,
  }) => {
    await expandSection(page, "Time Settings");
    await expect(
      page.getByText(/Upgrade to Pro to configure time settings/i),
    ).toBeVisible();
  });

  test("2.15 — EMA + VWAP free, others show lock + Pro badge", async ({
    page,
  }) => {
    await expandSection(page, "Indicators");

    await expect(
      page.getByRole("button", { name: /^EMA-9$/ }).first(),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: /^VWAP$/ }).first(),
    ).toBeEnabled();

    const rsiTile = page
      .locator("div.border-dashed")
      .filter({ hasText: "RSI" })
      .first();
    await expect(rsiTile).toBeVisible();
    await expect(rsiTile.getByText(/^Pro$/)).toBeVisible();
    await expect(rsiTile.locator("svg").first()).toBeVisible();
  });

  test("2.16 — Entry Method: only On Cross selectable", async ({ page }) => {
    await expandSection(page, "Entry Method");
    const entrySection = page
      .locator('[data-state="open"]')
      .filter({ hasText: "Entry Method" });
    const entrySelect = entrySection.getByRole("combobox").first();
    await entrySelect.click();

    const onCross = page.getByRole("option", { name: /On Cross/i });
    await expect(onCross).toBeVisible();
    await expect(onCross).toBeEnabled();

    const onClose = page.getByRole("option", { name: /On Close/i });
    const onRetest = page.getByRole("option", { name: /On Retest/i });
    await expect(onClose).toHaveAttribute("data-disabled", "");
    await expect(onRetest).toHaveAttribute("data-disabled", "");
    await expect(onClose.getByText(/^Pro$/)).toBeVisible();
    await expect(onRetest.getByText(/^Pro$/)).toBeVisible();
  });

  test("2.17 — Trailing Stop is fully blurred with upgrade overlay", async ({
    page,
  }) => {
    await expandSection(page, "Trailing Stop");
    await expect(
      page.getByText(/Upgrade to Pro to use trailing stops/i),
    ).toBeVisible();
  });

  test("2.18 — Trade Frequency is fully blurred with upgrade overlay", async ({
    page,
  }) => {
    await expandSection(page, "Trade Frequency Limits");
    await expect(
      page.getByText(/Upgrade to Pro to set frequency limits/i),
    ).toBeVisible();
  });

  test("2.19 — High Probability Filters fully blurred with upgrade overlay", async ({
    page,
  }) => {
    await expandSection(page, "High Probability Filters");
    await expect(
      page.getByText(/Upgrade to Pro to use filters/i),
    ).toBeVisible();
  });
});
