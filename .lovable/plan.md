## Goal
On the **Previous Runs** list, let users expand any completed run to reveal the same rich diagnostic info shown for the latest run — Engine Validation Verdict, Edge vs Luck findings, KPI cards, and trade summary — via a hide/show toggle.

## What's already in place
- `backtest_runs` already persists everything needed: KPIs (`net_pnl`, `win_rate`, `profit_factor`, `max_drawdown`, `wins/losses`, `avg_winner/loser`), `validation`, `validation_error`, `engine_version`, `execution_time_ms`, `direction`.
- The latest run renders this via `BacktestResultsPanel` → `BacktestKpiCards` + `BacktestVerdictPanel` + trade summary.
- No new database work, no edge function changes, no new queries.

## Changes (UI only)

**`src/components/backtesting/BacktestRunHistory.tsx`**
1. Track an expanded-row id in local state (single open at a time).
2. Add a chevron icon button (ChevronDown/ChevronRight from lucide-react) on each non-failed, completed row, placed left of the Delete button. `aria-label="Show details"` / `"Hide details"`, `aria-expanded` set accordingly.
3. When expanded, render an inset details block below the row containing:
   - `BacktestKpiCards` with the row's KPIs.
   - Small meta line: `Engine vX · Ys · direction`.
   - `BacktestVerdictPanel run={run}` (already handles missing/errored validation gracefully).
   - The same Trade Summary grid currently in `BacktestResultsPanel` (winners/losers/avg winner/avg loser) — extracted into a tiny local helper or inlined.
4. Only show the toggle for `status === 'complete'` rows; failed/active rows keep current behavior.
5. Keep the row layout intact when collapsed — no visual regression.

**Optional small refactor (only if clean):** extract the trade-summary grid out of `BacktestResultsPanel.tsx` into a shared `BacktestTradeSummary.tsx` so both the latest panel and the history expansion reuse it. Skip if it complicates the diff.

## Out of scope
- No schema changes, no migrations, no edge function edits.
- No changes to the latest-run panel behavior.
- No bulk expand/collapse, no deep-link to an expanded row.
