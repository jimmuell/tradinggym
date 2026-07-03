import type { Page } from "@playwright/test";
import noStopResultsDetail from "../fixtures/no-stop-run.json" with { type: "json" };

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

// A completed NO-STOP run with a full teaching payload, served entirely from mocks (no real
// backtest, no quota). The row is complete enough that BacktestResultsPanel — which shares an
// ErrorBoundary with the teach/coach panels — renders without crashing, and results_detail
// carries _same_signal:true + the six _teaching blocks so all six cards + the coach appear.
export async function stubCompletedNoStopRun(page: Page) {
  const row = {
    id: "e2e-no-stop",
    user_id: "e2e-user",
    strategy_id: "e2e-strategy",
    strategy_name: "E2E No-Stop Strategy",
    timeframe: "5m",
    start_date: "2020-01-01",
    end_date: "2025-12-31",
    initial_balance: 10000,
    status: "complete",
    stop_loss_points: 0,
    take_profit_points: 0,
    stop_loss_pct: 0,
    take_profit_pct: 0,
    stop_loss_ticks: 0,
    take_profit_ticks: 0,
    slippage_ticks: 1,
    qty_value: 2,
    direction: "long_short",
    commission_pct: 0,
    net_pnl: -49386,
    total_trades: 17564,
    wins: 7376,
    losses: 10188,
    win_rate: 0.42,
    profit_factor: 0.88,
    max_drawdown: -9000,
    avg_winner: 120.5,
    avg_loser: -95.2,
    equity_curve: [],
    ai_signal_code: "# e2e",
    engine_version: "25.6.1",
    execution_time_ms: 1234,
    error_message: null,
    validation: null,
    validation_error: null,
    created_at: "2026-07-03T00:00:00Z",
    results_detail: noStopResultsDetail,
  };
  await page.route("**/rest/v1/backtest_runs*", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "e2e-fake-run", status: "pending" }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([row]),
      });
    }
  });
}
