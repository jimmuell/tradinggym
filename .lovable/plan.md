

## Plan: Chart Display Defaults & Reset Behavior Fixes

### Problems Identified
1. **Thin candles on reset** — When replay resets to 0 and candles start appearing, `fitContent()` is called which squeezes bars across the full time axis, making them very thin.
2. **No time axis when empty** — When chart is reset/empty, the time scale has no reference data so it shows nothing.
3. **Y-axis/X-axis not preserved** — Each data update calls `fitContent()` or lets the chart auto-scale, losing the user's preferred view.

### Solution

**1. Set default visible range instead of fitContent (ChartContainer.tsx)**
- Store a saved logical range ref (`savedRangeRef`) that captures the visible range before data changes.
- After loading data or during replay, instead of `fitContent()`, set a fixed visible window: show the last ~100 bars for full data, or show a fixed logical range (e.g., `{from: -10, to: 100}`) for replay mode so candles have proper width from the start.
- Add `barSpacing` and `minBarSpacing` defaults to the `timeScale` config (e.g., `barSpacing: 6, minBarSpacing: 2`) to prevent ultra-thin candles.

**2. Show time axis even when no data (ChartContainer.tsx)**
- When entering replay mode (empty chart), instead of clearing all data, set a single invisible/placeholder data point or use `timeScale.setVisibleRange()` based on the full dataset's time range. This keeps the time axis labels visible.
- Alternative: after clearing data, apply `chart.timeScale().applyOptions()` with the known time range from `allDataRef.current` to keep axis labels.

**3. Preserve axis settings across timeframe switches (ChartContainer.tsx)**
- Before switching timeframes, save `getVisibleLogicalRange()` to a ref.
- After loading new data, restore the saved range (adjusted for data length) instead of calling `fitContent()`.
- For the price (Y) axis, use fixed `scaleMargins` (already set) and avoid auto-fitting. Set `autoScale: true` on the price scale so it adapts to visible data without losing spacing.

**4. Replay-specific default view (ChartContainer.tsx)**
- When replay starts or resets, set `timeScale.setVisibleLogicalRange({ from: -5, to: 80 })` to create a nicely spaced empty canvas ready for candles.
- As candles are added during replay, don't call `fitContent()` — instead scroll to keep the latest bar visible with `timeScale.scrollToPosition(2, false)` so the view follows the latest bar without resizing.

### Files to Modify
- **`src/components/chart/ChartContainer.tsx`** — All changes above (default barSpacing, saved range ref, replay range defaults, scrollToPosition during replay)

