import type { Page } from "@playwright/test";

// Force the tier to admin by intercepting the TierContext profile fetch, so the backtest
// config panel always renders fully unlocked and unmetered (admin bypasses both isStarter and
// outOfCredits — effectiveTier = isAdmin ? 'admin' : planState), independent of the shared
// account's real plan or the TierContext loading-race that briefly shows the Starter lock.
//
// TierContext.fetchTier uses .select('tier_state, plan_state, role').maybeSingle(), so the
// body must be a single OBJECT — an array would leave row.tier_state/plan_state/role undefined
// and fall back to starter/foundation (i.e. locked). isAdmin keys off role === 'admin'.
export async function forceAdminTier(page: Page) {
  await page.route("**/rest/v1/profiles*", async (route) => {
    // Only the TierContext query selects tier_state/plan_state/role — target just that one
    // (it uses .maybeSingle(), so return a single OBJECT). Let every other profiles query
    // (e.g. display_name for the header) pass through untouched so we don't break the panel.
    if (route.request().url().includes("tier_state")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tier_state: "coach", plan_state: "admin", role: "admin" }),
      });
    } else {
      await route.continue();
    }
  });
}

// Keep the panel's run list deterministic and side-effect-free:
//  - GET  -> no rows, so `hasActive` is false and the Run button stays idle ("Run backtest",
//    not "Running backtest…") regardless of leftover pending rows on the shared account.
//  - POST -> a fake inserted row (useCreateBacktestRun does .insert().select().single()), so a
//    mocked/failed run never writes a real pending row that would carry over to later tests.
export async function stubBacktestRuns(page: Page) {
  await page.route("**/rest/v1/backtest_runs*", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "e2e-fake-run", status: "pending" }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    }
  });
}
