## Problem

In `src/components/backtesting/BacktestRunHistory.tsx` line 108:

```ts
{format(new Date(run.start_date), 'MMM d')} – {format(new Date(run.end_date), 'MMM d, yyyy')}
```

`run.start_date` is a `YYYY-MM-DD` string (e.g. `2025-01-01`). `new Date("2025-01-01")` parses as **UTC midnight**, which renders as the previous day (Dec 31, 2024) in any negative-offset timezone. That's why the user sees `Dec 31 – Dec 30, 2025` instead of `Jan 1 – Dec 31, 2025`.

The end date looks correct only because Dec 31 happens to survive the shift visually, but it's also off by one (Dec 30 instead of Dec 31).

## Fix

1. Add a small local helper that parses `YYYY-MM-DD` as a **local** date (split on `-`, build with `new Date(y, m-1, d)`) so no timezone shift occurs.
2. Use it for both start and end dates in the run history line.
3. Also show the year on the start date when start/end years differ, so ranges like `Jan 1, 2024 – Dec 31, 2025` aren't ambiguous. When the years match, keep the compact form: `Jan 1 – Dec 31, 2025`.

## Files

- `src/components/backtesting/BacktestRunHistory.tsx` — add `parseYmdLocal()` helper, replace the date line with TZ-safe parsing and year-aware formatting.

## Out of scope

- The stored `start_date` / `end_date` values themselves are correct (the user's input was Jan 1 → Dec 31). No DB or edge-function change needed.
- `BacktestConfigPanel`'s date inputs use native `<input type="date">` and are unaffected.
