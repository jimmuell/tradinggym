// e2e/tier-loading-flash.spec.ts
//
// Regression guard for the "Starter-lock flash" (fixed in commit 81a8956).
//
// The bug: TierContext starts planState:'starter'/loading:true, then fetches the real plan.
// BacktestConfigPanel used to compute isStarter from planState WITHOUT waiting for loading, so
// a paid/admin user briefly saw the "Upgrade to Pro" lock before it flipped to the unlocked
// panel. The fix adds a loading guard that renders "Loading your plan…" until the tier resolves.
//
// How this test forces the (normally sub-second, flaky) window open: it intercepts the same
// TierContext profiles query the tier helper mocks, but DELAYS the response ~800ms. That makes
// the loading state deterministic, so we can assert the lock is never rendered during it.
//
// Fully mocked + quota-free: no real backtest runs, no dependence on the shared account's plan.

import { test, expect, type Page } from "@playwright/test";
import { stubBacktestRuns } from "./helpers/tier";

test.use({ storageState: "e2e/.auth.json" });

const TIER_RESOLVE_DELAY_MS = 800;

// Same interception as forceAdminTier(), but holds the tier_state response back by
// TIER_RESOLVE_DELAY_MS so the loading window is wide enough to assert against. Only the
// TierContext query (the one selecting tier_state) is delayed; every other profiles query
// (e.g. the header's display_name) passes through untouched.
async function delayedTier(
  page: Page,
  body: { tier_state: string; plan_state: string; role: string | null },
) {
  await page.route("**/rest/v1/profiles*", async (route) => {
    if (route.request().url().includes("tier_state")) {
      await new Promise((r) => setTimeout(r, TIER_RESOLVE_DELAY_MS));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    } else {
      await route.continue();
    }
  });
}

const LOADING = /Loading your plan/i;
const LOCK = /Upgrade to Pro/i;
const UNLOCKED = /Configure backtest/i;

test.describe("Tier loading — no Starter-lock flash", () => {
  // The core regression: a paid/admin user must NEVER see the Starter lock while the plan
  // resolves. During the delayed fetch the panel shows the loading spinner and the lock is
  // absent from the DOM; after it resolves, the unlocked panel appears and the lock still
  // never rendered.
  test("admin/paid user sees the loading spinner, never the Upgrade lock, then the unlocked panel", async ({
    page,
  }) => {
    await delayedTier(page, { tier_state: "coach", plan_state: "admin", role: "admin" });
    await stubBacktestRuns(page);

    await page.goto("/backtesting");

    // In the loading window: spinner is up, lock is NOT rendered (the guard early-returns
    // before the Starter branch, so the lock text cannot be in the DOM here).
    await expect(page.getByText(LOADING)).toBeVisible();
    await expect(page.getByText(LOCK)).toHaveCount(0);

    // After the tier resolves: unlocked panel renders and the lock never appeared.
    await expect(page.getByText(UNLOCKED)).toBeVisible();
    await expect(page.getByRole("combobox").first()).toBeVisible();
    await expect(page.getByText(LOCK)).toHaveCount(0);
  });

  // Symmetry / inverse flash: a genuine starter must see the loading spinner then the lock —
  // and must NOT flash the unlocked config panel in between.
  test("starter user sees the loading spinner, no unlocked-panel flash, then the Upgrade lock", async ({
    page,
  }) => {
    await delayedTier(page, { tier_state: "foundation", plan_state: "starter", role: null });
    await stubBacktestRuns(page);

    await page.goto("/backtesting");

    // Loading window: spinner up, unlocked panel NOT rendered.
    await expect(page.getByText(LOADING)).toBeVisible();
    await expect(page.getByText(UNLOCKED)).toHaveCount(0);

    // After resolve: the lock shows (correct for a starter).
    await expect(page.getByText(LOCK).first()).toBeVisible();
  });
});
