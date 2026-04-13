

## Theme-Aware Simulator: Remaining Files

### Status
The previous update already themed **Simulator.tsx**, **TopBar**, **BottomBar**, **LeftToolbar**, **RightToolbar**, **ReplayControls**, and **TradeOrderPanel**. Four files still have hardcoded dark-theme colors.

### Remaining Work

**1. `ChartContainer.tsx`** (largest change)

- **Chart JS config** (lines 125-151): `createChart()` hardcodes white background, `#787b86` text, `#e1ecf2` grid/borders. Import `useSettings`, resolve dark vs light, pass correct palette. Add a `useEffect` that calls `chart.applyOptions()` when theme changes.
  - Dark: bg `#131722`, grid `#1e222d`, text `#d1d4dc`, border `#2a2e39`
  - Light: bg `#ffffff`, grid `#e1ecf2`, text `#787b86`, border `#e1ecf2`
- **CurrencyDropdown** (lines 49-76): Replace `bg-white`, `text-[#131722]`, `border-[#d1d4dc]`, `hover:bg-[#f0f3fa]`, `bg-[#e8f0fe]` with `bg-card`, `text-foreground`, `border-border`, `hover:bg-accent`, `bg-accent`
- **OHLCV overlay** (lines 799-831): Replace `text-[#787b86]` with `text-muted-foreground`, `text-[#131722]` with `text-foreground`, `bg-[#f0f3fa]` with `bg-muted`, `border-[#d1d4dc]` with `border-border`
- **Replay positioning tooltip** (line 778): `bg-[#2a2e39]` → `bg-accent`, `text-[#d1d4dc]` → `text-foreground`, `border-[#363a45]` → `border-muted`
- **Replay ghost overlay** (line 770): `bg-white/60` → `bg-background/60`
- **Zoom controls** (lines 873-878): `bg-[#2a2e39]` → `bg-accent`, `hover:bg-[#363a45]` → `hover:bg-muted`, `text-[#d1d4dc]` → `text-foreground`
- **Chart area background** (line 757): `bg-white` → `bg-background`
- **Watermark** (line 869): `text-[#e0e3eb]` → `text-muted-foreground/20`
- Trading colors (green/red/blue on buy/sell buttons, position badges) stay fixed

**2. `ChartSettingsModal.tsx`**
- Modal container: `bg-[#1e222d]` → `bg-card`, `text-[#d1d4dc]` → `text-foreground`
- Headers: `text-white` → `text-foreground`
- Borders: `border-[#2a2e39]` → `border-border`
- Tab sidebar: `text-[#787b86]` → `text-muted-foreground`, active `bg-[#2a2e39]` → `bg-accent`
- Buttons: Cancel `bg-[#2a2e39]` → `bg-accent`, hover `bg-[#363a45]` → `hover:bg-muted`
- Toggle off state: `bg-[#363a45]` → `bg-muted`
- SelectBox: `bg-[#2a2e39]` → `bg-accent`, `border-[#363a45]` → `border-muted`
- ColorSwatch border: `border-[#363a45]` → `border-muted`
- Section headings: `text-[#787b86]` → `text-muted-foreground`

**3. `DateRangeModal.tsx`**
- Container: `bg-[#1e222d]` → `bg-card`, `text-[#d1d4dc]` → `text-foreground`, `border-[#2a2e39]` → `border-border`
- Header: `text-white` → `text-foreground`
- Labels: `text-[#787b86]` → `text-muted-foreground`
- Inputs/selects: `bg-[#131722]` → `bg-background`, `border-[#2a2e39]` → `border-border`, `text-[#d1d4dc]` → `text-foreground`
- Cancel button: `text-[#787b86]` → `text-muted-foreground`, `hover:text-[#d1d4dc]` → `hover:text-foreground`, `hover:bg-[#2a2e39]` → `hover:bg-accent`
- Data info spans: `text-[#d1d4dc]` → `text-foreground`
- Remove `[color-scheme:dark]` from date inputs, add `dark:[color-scheme:dark]`

**4. `TradeResultModal.tsx`**
- Trade details box: `bg-[#131722]` → `bg-background`, `border-[#2a2e39]` → `border-border`
- Detail labels: `text-[#787b86]` → `text-muted-foreground`
- Detail values: `text-[#d1d4dc]` → `text-foreground`
- Message text: `text-[#d1d4dc]` → `text-foreground`
- Close button: `text-[#787b86]` → `text-muted-foreground`
- **Keep** gradient backgrounds (`from-[#1a2e1a]`, `from-[#2e1a1a]`, `to-[#1e222d]`) and all trading colors (green/red/blue) as-is — these are accent/semantic

### Notes
- No new dependencies needed
- Trading semantic colors (`#26a69a`, `#ef5350`, `#2962ff`) remain hardcoded everywhere — intentional
- The chart canvas colors must be applied via JS `applyOptions()`, not CSS classes

