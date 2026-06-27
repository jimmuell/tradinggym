## Verify the redeployed `run-backtest` function

You're right — the 11:06–11:23 UTC rows pre-date the redeploy, so they prove nothing about the new code. We need a fresh run triggered *after* the redeploy landed.

### Plan

1. **Confirm redeploy timestamp.** Pull the latest `supabase--edge_function_logs` for `run-backtest` and note the boot/version timestamp. Anything created before that = stale, anything after = new code.

2. **Trigger a new run from the UI (recommended).** You click "Quick test (1 week)" on `/backtesting` and run it. This exercises the real client → edge → engine path, including auth, payload shape, and the `created_at` write.

   *Alternative if you'd rather I do it headlessly:* I can call the deployed function via `supabase--curl_edge_functions` with a minimal payload, but it will run as your preview session and create a real row in `backtest_runs`.

3. **Verify the new row.** Query `backtest_runs` for the row whose `created_at` is after the redeploy timestamp and confirm:
   - `status` transitions `queued → running → complete` (or `failed` with a clear engine error, not a 500 from the edge function).
   - `created_at` is populated and renders in `BacktestResultsPanel` / `BacktestRunHistory` as `MMM d, yyyy · h:mm a`.
   - `execution_time_ms`, `net_pnl`, `wins`, `losses`, `validation` are populated for a complete run.

4. **Verify the UI updates live.** Confirm the new row appears at the top of "Previous Runs" via the realtime subscription in `useBacktestRuns`, and the expand/collapse chevron reveals `BacktestKpiCards`, `BacktestVerdictPanel`, and `BacktestTradeSummary`.

5. **Report.** I'll post the new row's id, `created_at`, status, and a one-line note on whether the timestamp/history rendering matches expectations.

### Question

Do you want to trigger the run yourself from the UI (cleanest, no extra noise), or should I fire it via `curl_edge_functions`?
