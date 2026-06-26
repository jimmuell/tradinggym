# Session Changelog — 2026-06-26

## Backtesting Edge Function — Timezone Comparison Fix

Fixed engine failures caused by comparing timezone-aware market data timestamps against timezone-naive backtest start/end dates.

### Modified
- `supabase/functions/run-backtest/index.ts`
  - Added `toEngineUtcDateBound()` helper to normalize date-only values before calling the backtest engine.
  - Sends `start_date` as `YYYY-MM-DDT00:00:00Z` and `end_date` as `YYYY-MM-DDT23:59:59Z`.
  - Preserves already timezone-qualified timestamps.
  - Redeployed the `run-backtest` edge function.

### Result
- Prevents pandas `TypeError: Cannot compare tz-naive and tz-aware timestamps` in the engine's `data_first > start` comparison.