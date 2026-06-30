# Changelog — 2026-06-30

## Backtest cockpit (Guru/Admin) — fix cramped two-column layout / label wrapping

### Problem
On Guru/Admin tiers the backtest config panel rendered a fixed two-column cockpit beside the results panel. At the available width the columns were too narrow, causing labels such as "Take profit (points)", "Position size (contracts)", and "Statistical validation" to wrap awkwardly to multiple lines.

### Solution
- Made the cockpit layout responsive to the config panel's own available width:
  - Section grid now uses `grid-cols-[repeat(auto-fit,minmax(280px,1fr))]`, so it collapses to a single clean column when the panel is narrow and only shows two columns when there is genuine room.
  - Inner paired-field grids (Stop/Target, Qty/Slippage, Balance/Commission) use `grid-cols-[repeat(auto-fit,minmax(130px,1fr))]`, folding to one column when their section is too narrow.
- Gave Guru/Admin config panel a bit more breathing room:
  - `Backtesting.tsx` parent grid changed from `lg:grid-cols-[380px_1fr] xl:grid-cols-[minmax(380px,560px)_1fr]` to `lg:grid-cols-[minmax(380px,480px)_1fr] xl:grid-cols-[minmax(380px,560px)_1fr]`.
- Kept cockpit premium touches: accent ribbons, live cost summary, sticky Run button.
- Did not alter Pro/Expert single-column layout, field set, defaults, or behavior.

### Files changed
- `src/pages/Backtesting.tsx`
- `src/components/backtesting/BacktestConfigPanel.tsx`

## ADR-030 — Flat $/round-trip commission (default $1.24)

### Problem
Percent-of-notional commission distorts futures backtest results. Brokers like Amp Futures charge a flat dollar amount per round-trip (entry + exit + fees), not a percent.

### Solution
- **Migration**: added `commission_mode` (text) and `commission_per_rt` (numeric) to `backtest_runs`. Kept `commission_pct` for historical reads.
- **Edge function (`run-backtest`)**: derives `commission_rate = 0` when `commission_mode = 'flat_per_rt'` (clients don't need to send it). Forwards `commission_mode`, `commission_per_rt`, `commission_rate` to engine on both `/run` and `/run/compare`. Legacy rows fall back to the percent model. `ENGINE_REQUEST_RISK` log line updated to include the three commission fields.
- **Frontend**:
  - Commission field is now **"Commission ($ per round-trip, all-in)"**, default `1.24`. Legacy percent-distortion warning removed.
  - Cockpit live cost summary: commission drag = `commission_per_rt × qty × trades`.
  - `Backtesting.tsx` sends `{ commission_mode: 'flat_per_rt', commission_per_rt }`; no longer sends `commission_pct`.
  - Reuse-last-run hydrates from `commission_per_rt`.

### Deploy order
1. Migration applied.
2. `run-backtest` edge function redeployed.
3. Frontend published last (this changelog entry).

### Out of scope
Slippage, validation panel, tier gating.

### Files changed
- `supabase/functions/run-backtest/index.ts`
- `src/components/backtesting/BacktestConfigPanel.tsx`
- `src/pages/Backtesting.tsx`
- `src/hooks/useBacktestRuns.ts`
