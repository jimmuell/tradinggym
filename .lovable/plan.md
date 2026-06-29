## Goal

Add bulk-select + delete in the Previous Runs panel on `/backtesting`, and make the latest run deletable from the same place.

## Changes (single file: `src/components/backtesting/BacktestRunHistory.tsx`)

1. **Include the latest run** — change `runs.slice(1, 11)` to `runs.slice(0, 11)` and render the panel whenever `runs.length >= 1` (drop the `<= 1` early return). The "Run details" panel above still shows the latest run; this just makes it deletable here too.

2. **Selection state** — add `selectedIds: Set<string>`. Only completed/failed rows are selectable (skip `pending`/`running` to avoid deleting in-flight runs).

3. **Per-row checkbox** — add a `<Checkbox>` at the left of each row (before the chevron/label). Disabled for active runs.

4. **Header controls** (replacing the current header layout):
   - Left: `CardTitle "Previous Runs"`.
   - Right cluster:
     - "Select all" checkbox (indeterminate when partial), selects all eligible rows.
     - `Delete selected (N)` destructive button — visible only when `selectedIds.size > 0`.
     - Existing "Clear failed runs" link — keep.

5. **Bulk delete confirm** — extend `ConfirmState` with `{ kind: 'bulk'; ids: string[] }`. Reuse the existing `AlertDialog` with title "Delete N backtest runs?" and body explaining permanence. `handleConfirm` runs `Promise.all(ids.map(deleteRun.mutateAsync))`, then clears `selectedIds` and shows a toast.

6. **Edge cases**
   - Skip active runs from "select all" and disable their checkboxes.
   - After deletion, prune any stale IDs from `selectedIds`.
   - If the latest run is the only run and gets deleted, the panel hides (no rows). The Results panel above will read `runs[0] ?? null` as before.

## Out of scope

- No changes to `useBacktestRuns` (delete mutation already exists and invalidates queries).
- No edge-function, schema, or RLS changes.
- No changes to `BacktestResultsPanel`, compare panel, or optimize panel.

## Verify

- Typecheck passes.
- Manual: select 2+ rows including the latest → "Delete selected (N)" → confirm → all gone, latest panel updates. Try select-all with a mix of complete/failed/running → running rows stay; rest delete.
