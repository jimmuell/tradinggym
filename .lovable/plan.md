

## Plan: Match TradingView Icons, Placement & Spacing

Based on the four reference screenshots, here's what needs to change in each toolbar to match TradingView's exact icon set, ordering, grouping, and spacing.

---

### 1. Left Toolbar (`LeftToolbar.tsx`)

**Current:** 14 icons in a flat list with no separators.

**Reference (image 1) — top to bottom with divider groups:**
- Group 1: Crosshair (cursor selector)
- Group 2: TrendingUp (trend line), AlignJustify (horizontal lines), GitFork/Network (pitchfork/gann), Waypoints (fib tools)
- Group 3: Shuffle (pattern/Elliott), Type (text), Smile (emoji/sticker)
- *divider*
- Group 4: Brush (highlighter), ZoomIn (zoom), Magnet (snap)
- *divider*
- Group 5: Ruler (measure), Lock, Eye
- *divider*
- Group 6: Link, Trash2
- *spacer to bottom*
- Star (favorites, pinned at bottom)

**Changes:**
- Replace icons to closer matches: swap `Pen` → `Waypoints`, `Grid3X3` → `ZoomIn`, `Camera` → `Smile`, `Settings` → `Shuffle`, add `AlignJustify`
- Add thin `border-b border-[#2a2e39]` dividers between groups using `div` spacers
- Pin `Star` to the bottom with `mt-auto`
- Keep 44px width, 18px icons

---

### 2. Top Bar (`TopBar.tsx`)

**Current:** Mostly correct layout, minor icon/ordering differences.

**Reference (image 2) — left to right:**
- Symbol badge "MES1!" (rounded chip style), search icon, plus icon
- Timeframes: 1m, 15m, 1h, 4h, 5m (highlighted), dropdown arrow
- *divider*
- Candlestick type icon (small candle SVG)
- "Indicators" with grid icon + dropdown
- *divider*
- Bell + "Alert"
- Rewind + "Replay"
- *divider*
- Undo, Redo
- *spacer*
- Right-side icons: various small drawing/layout tools (~8 icons)
- *divider*
- "Day Trading" dropdown
- *divider*
- TV logo + "Trade" button
- "Publish" button (blue)

**Changes:**
- Add `15m` and `4h` to timeframes array (currently missing)
- Style symbol "ES" as a rounded chip/badge with border
- Add a small candlestick-type SVG icon before "Indicators"
- Add small TV logo SVG next to "Trade" button
- Minor spacing adjustments to match tighter grouping

---

### 3. Right Toolbar (`RightToolbar.tsx`)

**Current:** 9 icons in a flat list.

**Reference (image 3) — top to bottom with spacing:**
- Top group (5 icons): Notepad/List, Clock/History, Layers, MessageSquare, (empty gap)
- *large spacer*
- Bottom group (5 icons): Target/Crosshair, AlertTriangle, Calendar, Wifi/Signal, Grid (dots), HelpCircle

**Changes:**
- Restructure into two groups: top cluster and bottom cluster (pinned to bottom with `mt-auto`)
- Replace icons: `BarChart2` → `Clock`, `ShieldCheck` → `Layers`, `Flame` → `Wifi`
- Add `Target` icon to bottom group
- Remove excess icons, match exact count from reference

---

### 4. Bottom Bar (`BottomBar.tsx`)

**Reference (image 4) shows two rows:**
- **Row 1 (timeframe bar):** 1D, 5D, 1M, 3M, 6M, YTD, 1Y, 5Y, All, calendar icon, spacer, time + exchange info — already mostly correct
- **Row 2 (trading bar):** "Strategy Report" tab, "Paper Trading" tab (active), "Trade" tab, then account stats (Account balance, Equity, Realized P&L, etc.)

**Changes:**
- Add "5Y" to timeframes array
- Add a second row below with tabs: "Strategy Report", "Paper Trading", "Trade"
- Add account stats section in second row: Account balance, Equity, Realized P&L, Unrealized P&L, Account margin, Available funds, Orders margin, Margin buffer

---

### Files to Modify
- `src/components/chart/LeftToolbar.tsx` — icon replacement, divider groups, bottom-pinned star
- `src/components/chart/TopBar.tsx` — add timeframes, symbol badge style, candle icon, TV logo
- `src/components/chart/RightToolbar.tsx` — split into top/bottom groups, icon replacements
- `src/components/chart/BottomBar.tsx` — add 5Y, add second trading info row

### Technical Notes
- All icons sourced from `lucide-react` (closest available matches)
- Dividers use `<div className="w-6 h-px bg-[#2a2e39] my-1" />` pattern
- Bottom-pinning uses `mt-auto` in flex column containers
- No new dependencies needed

