import { test, expect, type Page } from "@playwright/test";
import { forceAdminTier, stubBacktestRuns, stubCompletedNoStopRun } from "./helpers/tier";

test.use({ storageState: "e2e/.auth.json" });

// Deterministic, quota-free: the tier is mocked to admin (fully unlocked, unmetered) and any
// real-run path is mocked, so nothing here depends on the shared account's plan or 5/month cap
// and no real backtest is executed. NOTE: the date fields are a calendar PICKER
// (DatePickerField -> #bt-start-date / #bt-end-date), NOT a typed `placeholder="YYYY-MM-DD"`
// input, so we assert the populated defaults rather than typing.
const DATE_RE = /\d{4}-\d{2}-\d{2}/;

// Run backtest stays disabled until a strategy is chosen; the <Select> is disabled while
// strategies load, so wait for it to be enabled and the option list before clicking.
async function pickFirstStrategy(page: Page) {
  const combo = page.getByRole("combobox").first();
  await expect(combo).toBeEnabled();
  await combo.click();
  const option = page.getByRole("option").first();
  await option.waitFor({ state: "visible" });
  await option.click();
}

test.describe("Backtesting form (deterministic)", () => {
  test.beforeEach(async ({ page }) => {
    await forceAdminTier(page);
    await stubBacktestRuns(page);   // no active runs -> Run button idle; no real writes
    await page.goto("/backtesting");
    await expect(page.getByText(/Configure backtest/i)).toBeVisible();
    // tier resolved to the unlocked panel — the strategy picker is present
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  // 1 — date fields render valid, in-range values (they were blank/broken last session).
  //     Dates are a calendar picker now; assert the triggers show a real date, not the empty state.
  test("date pickers render with valid populated defaults", async ({ page }) => {
    await expect(page.locator("#bt-start-date")).toBeVisible();
    await expect(page.locator("#bt-end-date")).toBeVisible();
    await expect(page.locator("#bt-start-date")).toHaveText(DATE_RE);
    await expect(page.locator("#bt-end-date")).toHaveText(DATE_RE);
  });

  // 2 — Run gating (no real run)
  test("Run is disabled until a strategy is selected", async ({ page }) => {
    const run = page.getByRole("button", { name: /run backtest/i });
    await expect(run).toBeDisabled();
    await pickFirstStrategy(page);
    // valid default dates already satisfy datesValid, so a strategy is the only remaining gate
    await expect(run).toBeEnabled();
  });

  // 4 — ErrorBoundary: a failed handoff shows an error, not a blank white screen (mocked run)
  test("failed run shows an error, not a blank screen", async ({ page }) => {
    await page.route("**/functions/v1/run-backtest", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: "Engine did not accept the job" }),
      }),
    );
    await pickFirstStrategy(page);
    await page.getByRole("button", { name: /run backtest/i }).click();
    // page stays intact (not a blank crash)
    await expect(page.getByText(/Configure backtest/i)).toBeVisible();
    await expect(page.getByText(/failed|error|did not accept/i).first()).toBeVisible({ timeout: 30_000 });
  });

  // 3 — THE regression: a completed NO-STOP run must still render all six teach cards + Ask the
  //     Coach. Fully mocked (completed-row fixture + forced admin tier) — no real backtest.
  test("no-stop completed run renders all 6 teach cards + Ask the Coach", async ({ page }) => {
    await forceAdminTier(page);
    await stubCompletedNoStopRun(page);
    await page.goto("/backtesting");

    // the six exact titles (from titleFor)
    for (const title of [
      "What your stop did", "What your take-profit did", "What commission cost you",
      "What your direction choice did", "What slippage cost you", "What your position size did",
    ]) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /ask the coach/i })).toBeVisible();

    // must NOT be a fallback state
    await expect(page.getByText(/No teaching data was returned/i)).toHaveCount(0);
    await expect(page.getByText(/couldn't produce a reliable comparison/i)).toHaveCount(0);
  });
});
