

## Plan: Match TradingView Dimensions & Styling

Based on the extracted TradingView dimensions, update all layout components to match pixel-perfect sizing.

### Changes

**1. TopBar.tsx** — Height 38px (already correct), add a second sub-header info bar (26px) showing symbol info (OHLC values, volume, change %)

**2. LeftToolbar.tsx** — Widen from 38px to 44px (`w-[44px]`), adjust icon sizes from 16px to 18px, add subtle divider groupings between tool categories

**3. RightToolbar.tsx** — Widen from 38px to 44px (`w-[44px]`), match icon sizes to 18px

**4. BottomBar.tsx** — Reduce height from 32px to 26px (`h-[26px]`), adjust font sizes and padding accordingly

**5. ChartContainer.tsx** — Update chart `timeScale` height to 26px, price scale width to ~55px via `rightPriceScale: { width: 55 }` in chart options

**6. Index.tsx** — No structural changes needed; the flex layout will automatically adjust to new component sizes

### Color/Style Tweaks (all files)
- Border color already `#2a2e39` (correct)
- Background colors already `#131722` / `#1e222d` (correct)
- Text colors already `#d1d4dc` / `#787b86` (correct)
- No color changes needed

### Files to Modify
- `src/components/chart/LeftToolbar.tsx`
- `src/components/chart/RightToolbar.tsx`
- `src/components/chart/BottomBar.tsx`
- `src/components/chart/ChartContainer.tsx`

