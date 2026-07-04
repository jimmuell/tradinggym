## What & why

Add a live-updating elapsed-time counter next to the "Backtesting in progress" title in `BacktestResultsPanel.tsx`, and confirm final runtime persistence.

## Storage check (already done)

- `backtest_runs.execution_time_ms` already exists and is written by the engine on completion (via `backtest-callback` — it's in the ALLOWED write list).
- `created_at` is set when the row is inserted (status `pending`).
- **Conclusion: no schema change or new persistence needed.** Start = `created_at`, end = `created_at + execution_time_ms` (or "now" while running).

## Frontend change (only file touched)

`src/components/backtesting/BacktestResultsPanel.tsx`, the `pending/running` branch (lines 36–65):

1. Add a small `useElapsed(startIso)` hook (local to the file): `useState` + `useEffect` with `setInterval(…, 1000)`, cleared on unmount. Returns seconds since `startIso`.
2. Render the elapsed time inline with the title, e.g.:
   ```
   Backtesting in progress · 0:42
   ```
   Format `m:ss` under 1 h, `h:mm:ss` above. Use `tabular-nums text-muted-foreground` so digits don't jitter.
3. Drive it from `run.created_at`. The `useBacktestRuns` query already refetches every 5 s while a run is active, so `run` stays fresh; the 1 s interval gives smooth ticking between refetches.
4. On the completed branch (line ~124) the existing `execution_time_ms` display already shows final runtime — no change needed there.

## Out of scope

- No changes to the edge function, callback, DB schema, hashing, or any other panel.
- No new dependency.

## Verification

- Start a run → title shows "Backtesting in progress · 0:01", ticks every second, stops when the card flips to the completed view.
- Completed card still shows the final `execution_time_ms` seconds as today.
