import { test, expect } from "@playwright/test";

test.describe("Landing page — public", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("1.1 — hero renders with headline and two CTAs", async ({ page }) => {
    const heroHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toHaveText(/Build\s+Test\s+Master/i);
    await expect(
      page.getByRole("link", { name: /start free/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /see how it works/i }).first(),
    ).toBeVisible();
  });

  test("1.2 — hero badge shows futures contract symbols", async ({ page }) => {
    await expect(page.getByText(/MES.*MNQ.*ES.*NQ.*YM/).first()).toBeVisible();
  });

  test("1.3 — feature spotlight strip shows 3 cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "AI Strategy Builder", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Strategy Playback", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Data-Driven Validation", exact: true }),
    ).toBeVisible();
  });

  test("1.4 — feature grid shows 6 cards", async ({ page }) => {
    const labels = [
      "Trading Simulator",
      "AI Strategy Ingestion",
      "Strategy Playback Trainer",
      "Analytics & Performance",
      "Guru Platform",
      "Desktop Trading Companion",
    ];
    for (const label of labels) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("1.5 — How It Works section with 4 steps", async ({ page }) => {
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.toLowerCase()).toContain("describe your strategy");
    expect(bodyText.toLowerCase()).toMatch(/ai extracts/);
    expect(bodyText.toLowerCase()).toContain("watch the demo");
    expect(bodyText.toLowerCase()).toContain("practice");
  });

  test("1.6 — pricing section shows 4 cards with names and prices", async ({
    page,
  }) => {
    await page.evaluate(() =>
      document.getElementById("pricing")?.scrollIntoView()
    );
    await page.waitForTimeout(300);
    const tiers: [string, string][] = [
      ["Free", "$0"],
      ["Pro", "$29"],
      ["Expert", "$49"],
      ["Guru", "$99"],
    ];
    for (const [name, price] of tiers) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(price, { exact: false }).first()).toBeVisible();
    }
  });

  test("1.7 — Pro card has Most Popular badge", async ({ page }) => {
    await expect(page.getByText(/most popular/i).first()).toBeVisible();
  });

  test("1.8 — Guru card has For Coaches badge and monetization callout", async ({
    page,
  }) => {
    await expect(page.getByText(/for coaches/i).first()).toBeVisible();
    await expect(
      page
        .getByText(/built-in monetization|get paid to teach|earn revenue/i)
        .first(),
    ).toBeVisible();
  });

  test("1.9 — Expert card has at least one coming soon item", async ({
    page,
  }) => {
    const expertCard = page
      .locator("div", {
        has: page.getByRole("heading", { name: "Expert", exact: true }),
      })
      .filter({ hasText: "$49" })
      .first();
    await expect(expertCard).toBeVisible();
    await expect(expertCard.getByText("Soon", { exact: true }).first()).toBeVisible();
  });

  test("1.10 — Guru CTA band with text and Start Teaching button", async ({
    page,
  }) => {
    await expect(
      page
        .getByText(/run your trading education|turn your.*expertise/i)
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start teaching/i }).first(),
    ).toBeVisible();
  });

  test("1.11 — stats bar with at least one matching stat", async ({ page }) => {
    await expect(
      page
        .getByText(/historical data|strategy phases|database|\$0.*risk/i)
        .first(),
    ).toBeVisible();
  });

  test("1.12 — Start Free CTA navigates to /auth", async ({ page }) => {
    await page.getByRole("link", { name: /start free/i }).first().click();
    await page.waitForURL(/\/auth/);
    expect(page.url()).toMatch(/\/auth/);
  });

  test("1.13 — See How It Works CTA smooth scrolls", async ({ page }) => {
    const initialY = await page.evaluate(() => window.scrollY);
    await page.getByRole("link", { name: /see how it works/i }).first().click();
    await page.waitForTimeout(1000);
    const newY = await page.evaluate(() => window.scrollY);
    expect(newY).toBeGreaterThan(initialY);
  });

  test("1.14 — no horizontal overflow", async ({ page }) => {
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
});
