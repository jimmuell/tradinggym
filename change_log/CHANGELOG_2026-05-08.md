# Session Changelog — 2026-05-08

## 2026-05-08 — PL-028: TradingView Branding Removal (Simulator UI)

Removed all explicit TradingView branding, contract-month references, and TV-specific UI patterns from the Simulator UI. Legitimate partner references in `Resources.tsx`, `PineExportModal.tsx`, and `Landing.tsx` were intentionally left untouched.

### Files Modified
- `src/components/chart/TradeOrderPanel.tsx`
  - Replaced TV badge (`bg-[#2962ff]` + "TV") with TradingGYM badge (`bg-primary` + "TG").
  - Stripped contract month from label: `${instrument}M2026` → `instrument` (e.g. "MESM2026" → "MES").
- `src/components/chart/BottomBar.tsx`
  - Deleted the `TVIcon` component.
  - Removed `<TVIcon />` from the Paper Trading tab button (text-only label now).
- `src/components/chart/TopBar.tsx`
  - Removed the "Publish" button (TradingView concept).
  - Removed the trailing divider before the deleted Publish button.
- `src/components/chart/ChartContainer.tsx`
  - Removed the "TV" watermark in the bottom-left of the chart overlay.
  - Time-axis month labels left as-is (Lightweight Charts default formatting, not branding).
- `src/pages/Settings.tsx`
  - TradingGYM Live description: "use alongside TradingView" → "use alongside your trading platform".

### Notes
- `#2962ff` retained where it serves as standard buy-side trading UI convention (Trade panel buttons, toggles).
- No backend, schema, or edge-function changes.
