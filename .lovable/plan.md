## Problem

`BacktestComparePanel.tsx` reads each equity-curve point as `{ date, equity }`, but the engine writes `{ timestamp, equity }`. Every point fails the `if (!pt?.date) return` check, so `byDate` stays empty and the panel renders "No equity-curve data available." The `BacktestRun.equity_curve` TS type in `useBacktestRuns.ts` likely also declares `date`, masking the mismatch.

## Fix (read-only render change, scoped to compare panel)

1. **`src/hooks/useBacktestRuns.ts`** — update the `equity_curve` element type to `{ timestamp: string; equity: number }` (the actual DB shape). No write-path or query change.

2. **`src/components/backtesting/BacktestComparePanel.tsx`** — in the `equityData` memo:
   - Key each point by `pt.timestamp` instead of `pt.date`.
   - Compute the per-run base from `curve[0].equity` (fallback to `r.initial_balance`).
   - Push `(equity / base - 1) * 100` per run into a map keyed by timestamp.
   - Sort rows by timestamp ascending.
   - Update the `XAxis dataKey` and tooltip `labelFormatter` to use `timestamp` and format via `new Date(ts).toLocaleDateString(...)`.
   - Keep `connectNulls` on each `<Line>` so runs with different timestamp grids still draw.

3. **Mixed availability** — `hasEquity` currently goes false only when every run lacks data (it already does, since the map merges all runs). Confirm the "no data" empty state shows only when **all** selected runs have empty `equity_curve`; runs with data still draw via `connectNulls`. No other change needed — Recharts will simply skip undefined keys per row.

## Out of scope

- No edge function, migration, schema, or write-path changes.
- No changes to other panels (`BacktestResultsPanel`, `BacktestRunHistory`, etc.) even if they read `equity_curve` — this ticket is scoped to the compare panel render bug.

## Verify

- Typecheck passes after the type tweak.
- Manual: open Compare runs, pick two recent completed runs (including `aef6e4b0-…`), confirm two % return lines render. Pick one new + one legacy empty-curve run, confirm the new one still draws.

## Deploy

Frontend-only change — no edge function redeploy needed. Lovable auto-builds on agent edits.
