import { test, expect, type Page } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_ACCOUNTS } from "./auth.env";
import { forceAdminTier, stubBacktestRuns } from "./helpers/tier";

// Lane B batch 2 — quota-free cases (X-03 error-states, LRN-04 tier gates). No real backtests,
// no metered calls. Runs against the Published host. STR-03 (live) is a separate *.live.spec.ts.

// ── X-03 — error states / ErrorBoundary ────────────────────────────────────────────────────────
// Extends the existing backtesting.spec.ts ErrorBoundary coverage: that guard mocks a 502 JSON;
// this exercises a nastier failure (hard 500, non-JSON body) and adds the "app stays usable"
// half — the run button recovers, the config panel is intact, and the screen is not blank.
test.describe("X-03 — error states / ErrorBoundary (quota-free)", () => {
  test.use({ storageState: "e2e/.auth.json" });
  test("failing backtest shows a clear error and the app stays usable (no blank/crash)", async ({ page }) => {
    await forceAdminTier(page);
    await stubBacktestRuns(page);
    await page.route("**/functions/v1/run-backtest", (r) =>
      r.fulfill({ status: 500, contentType: "text/html", body: "<html>Internal Server Error</html>" }),
    );
    await page.goto("/backtesting");
    await expect(page.getByText(/Configure backtest/i)).toBeVisible();
    const combo = page.getByRole("combobox").first();
    await expect(combo).toBeEnabled();
    await combo.click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /run backtest/i }).click();

    // a clear error is surfaced (not silent)
    // the ACTUAL failure toast (Backtesting.tsx:79 → `Failed to start backtest: …`) — a specific
    // rendered string, not incidental page copy. Proven to have teeth: a 200 mock makes this go red
    // (see lane-b results).
    await expect(page.getByText(/Failed to start backtest/i)).toBeVisible({ timeout: 30_000 });
    // app stays usable — config panel intact, run button back, screen not blank
    await expect(page.getByText(/Configure backtest/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^run backtest/i })).toBeVisible();
    expect((await page.locator("body").innerText()).length).toBeGreaterThan(200); // not a blank white screen
  });
});

// ── LRN-04 — Tier 1/2/3 lesson gates ───────────────────────────────────────────────────────────
// The positive half (Tier 2/3 OPEN) requires the trading-performance gates (20 sessions, win rate,
// step accuracy) which cannot be earned in a script and must NOT be forced via SQL — so only the
// negative gates + the legitimately-reached Tier 1 are asserted here. See lane-b results notes.
test.describe("LRN-04 — Tier lesson gates (real accounts, no SQL)", () => {
  const GATES: Array<[string, RegExp]> = [
    ["tier1", /Complete Foundation to unlock/i],
    ["tier2", /Complete Tier 1 to unlock/i],
    ["tier3", /Complete Tier 2 to unlock/i],
  ];

  test("un-graduated account: Tier 1/2/3 all locked with correct progression gates", async ({ page }) => {
    await login(page, TEST_ACCOUNTS.starter.email, TEST_ACCOUNTS.starter.password);
    for (const [tier, gate] of GATES) {
      await page.goto(`/learning/${tier}`);
      await expect(page.getByText(gate)).toBeVisible();
    }
  });

  test("Foundation-graduated (tier1) account: Tier 1 OPEN; Tier 2/3 still locked", async ({ page }) => {
    // pro@gmail.com is legitimately at tier_state 'tier1' (graduated during the GU-11 pass); it has
    // reached Tier 1 only — so Tier 1 is open, Tier 2/3 correctly still gated. (The former S-grad
    // account jamesloganmueller+sgrad@gmail.com now has invalid credentials — see results notes.)
    await login(page, "pro@gmail.com", process.env.TEST_PASSWORD ?? "");
    await page.goto("/learning/tier1");
    await expect(page.getByText(/Complete Foundation to unlock/i)).toHaveCount(0); // Tier 1 not gated
    await expect(page.getByText(/Tier 1|Price Action|Opening Range|ORB/i).first()).toBeVisible();
    await page.goto("/learning/tier2");
    await expect(page.getByText(/Complete Tier 1 to unlock/i)).toBeVisible(); // Tier 2 still gated (correct)
    await page.goto("/learning/tier3");
    await expect(page.getByText(/Complete Tier 2 to unlock/i)).toBeVisible(); // Tier 3 still gated (correct)
  });
});
