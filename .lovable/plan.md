# Phase 1 — Mobile Quick Wins

Goal: stop content from overflowing on small screens and make the non-chart pages comfortably usable on a phone. The simulator/chart pages are explicitly out of scope (deferred to Phase 2).

## What will change

### 1. Fix the KPI card overflow (the bug in your screenshot)
File: `src/components/backtesting/BacktestKpiCards.tsx`

- Switch the value font from a fixed `text-2xl` to responsive: `text-lg sm:text-xl lg:text-2xl`.
- Add `truncate` + `min-w-0` to the value and card so long numbers can't blow past the card edge.
- Format large dollar amounts compactly (e.g. `-$4.2K` instead of `-$4,185.99`) once the value crosses 10,000, with the full number available on hover via `title`.
- Tighten card padding on mobile (`p-3 sm:p-4`) and gap (`gap-2 sm:gap-3`).
- Adjust grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (currently jumps from 2 → 3 only at `md`, leaving an awkward window).

### 2. Apply the same treatment to other stat tiles
File: `src/components/analytics/WinLossStats.tsx`
- Responsive font sizing + truncation on the Wins/Losses/Breakevens numbers.

### 3. Backtesting page layout
File: `src/pages/Backtesting.tsx`
- Current layout is `grid-cols-1 lg:grid-cols-[380px_1fr]`. Already stacks on mobile — good.
- Audit `BacktestConfigPanel` and `BacktestResultsPanel` for any fixed widths or non-wrapping rows; add `flex-wrap` and `min-w-0` where needed.
- Make the previous-runs row wrap gracefully on narrow widths (status badge + PnL + time + delete currently sit on one line).

### 4. Analytics page audit
Files: `src/pages/Analytics.tsx` + chart components (`EquityCurveChart`, `DailyPnlChart`, `FeeDragChart`, `SessionNetPnlChart`)
- Confirm Recharts `ResponsiveContainer` usage; reduce chart heights on mobile.
- Stack any side-by-side card grids at `< sm`.

### 5. Tables become horizontally scrollable on mobile
Files: any page using `<Table>` (admin pages, strategies list, trades, etc.)
- Wrap tables in `<div className="overflow-x-auto">` so columns don't compress into illegible mush.

### 6. Dashboard, Profile, Settings, Auth, Learning sweep
- Quick visual pass at 375px wide; fix any obvious overflow, fixed widths, or non-responsive grids. Most shadcn pieces already handle this — expecting only minor tweaks.

## Out of scope (deferred to Phase 2)

- `/simulator` and any chart-heavy page — these stay desktop/tablet only. Phase 2 will add a friendly "use a larger screen" gate at `< 768px` for these routes.
- No native app / Capacitor work.
- No PWA / installable behavior.

## How I'll verify

After each change I'll resize the preview to 375px (iPhone SE) and 414px (iPhone Plus) widths to confirm no horizontal scroll and no overflowing values, then back to desktop to confirm nothing regressed.

## Estimated scope

~6–8 files touched, all CSS-class-level changes. No data model, no routing, no behavior changes.
