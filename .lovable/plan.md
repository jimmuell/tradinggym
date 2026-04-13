

## Theme-Aware Simulator Page

### Problem
The Simulator page and all 10 child components use hardcoded dark-theme hex colors (`#131722`, `#1e222d`, `#2a2e39`, `#787b86`, `#d1d4dc`, etc.). Switching to Light or System theme has no effect on the Simulator — it stays dark regardless.

### Scope
11 files need updates. Two categories of work:

**Category A — CSS classes (10 components):**
Replace hardcoded Tailwind hex classes with semantic theme tokens, identical to what we did for Profile/Settings/Dashboard.

| File | Hardcoded colors found |
|------|----------------------|
| `Simulator.tsx` | bg, border, text |
| `TopBar.tsx` | bg, border, text, hover states |
| `BottomBar.tsx` | bg, border, text, active states |
| `LeftToolbar.tsx` | bg, border, text |
| `RightToolbar.tsx` | bg, border, text |
| `TradeOrderPanel.tsx` | bg, border, text, inputs |
| `ChartSettingsModal.tsx` | bg, border, text, selects |
| `ReplayControls.tsx` | bg, border, text |
| `DateRangeModal.tsx` | bg, border, text, inputs |
| `TradeResultModal.tsx` | bg, border, text |

Color mapping (same as previous plan):
- `bg-[#131722]` → `bg-background`
- `bg-[#1e222d]` → `bg-card`
- `border-[#2a2e39]` → `border-border`
- `text-white` / `text-[#d1d4dc]` → `text-foreground`
- `text-[#787b86]` → `text-muted-foreground`
- `bg-[#2a2e39]` (hover/active) → `bg-accent`
- `bg-[#363a45]` → `bg-muted`
- `bg-[#131722]` (inputs) → `bg-background`

Intentionally preserved colors (not theme-dependent):
- `#26a69a` (green/bullish) — trading semantic
- `#ef5350` (red/bearish) — trading semantic
- `#2962ff` (blue accent/CTA) — brand color

**Category B — Chart JS config (ChartContainer.tsx):**
The `createChart()` call on line 125 hardcodes `background: '#ffffff'`, `textColor: '#787b86'`, grid colors, and border colors. These need to read the current theme from `useSettings()` and apply light vs dark chart palettes dynamically. When theme changes, call `chart.applyOptions()` to update.

Light chart palette: white background, `#e1ecf2` grid (already set)
Dark chart palette: `#131722` background, `#1e222d` grid, `#d1d4dc` text

### Changes

1. **`src/pages/Simulator.tsx`** — Replace 3 hardcoded color classes with theme tokens
2. **`src/components/chart/TopBar.tsx`** — Replace ~20 hardcoded colors with theme tokens
3. **`src/components/chart/BottomBar.tsx`** — Replace ~30 hardcoded colors with theme tokens
4. **`src/components/chart/LeftToolbar.tsx`** — Replace ~5 hardcoded colors
5. **`src/components/chart/RightToolbar.tsx`** — Replace ~5 hardcoded colors
6. **`src/components/chart/TradeOrderPanel.tsx`** — Replace ~25 hardcoded colors
7. **`src/components/chart/ChartSettingsModal.tsx`** — Replace ~15 hardcoded colors
8. **`src/components/chart/ReplayControls.tsx`** — Replace ~8 hardcoded colors
9. **`src/components/chart/DateRangeModal.tsx`** — Replace ~10 hardcoded colors
10. **`src/components/chart/TradeResultModal.tsx`** — Replace ~10 hardcoded colors (keep gradient accent colors for win/loss)
11. **`src/components/chart/ChartContainer.tsx`** — Import `useSettings`, add `useEffect` to apply chart colors based on resolved theme, update `createChart` initial config

### Notes
- The `CurrencyDropdown` inside ChartContainer also has hardcoded light-theme colors that need updating
- Trading colors (green/red/blue) stay fixed — they're semantic to trading, not theme-dependent
- The chart canvas itself (lightweight-charts) must be updated via JS `applyOptions()`, not CSS

