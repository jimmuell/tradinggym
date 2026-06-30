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
