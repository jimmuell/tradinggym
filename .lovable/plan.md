

## Persist TP/SL Exit Settings

**Problem**: The TP and SL tick values reset to hardcoded defaults (75 and 25) on every mount, overwriting any previous user settings.

**Solution**: Save `tpTicks`, `slTicks`, `tpEnabled`, and `slEnabled` to `localStorage` and restore them on mount.

### Changes

**File: `src/components/chart/TradeOrderPanel.tsx`**
- Initialize `tpTicks`, `slTicks`, `tpEnabled`, `slEnabled` from `localStorage` instead of hardcoded values
- Add a `useEffect` that writes these four values to `localStorage` whenever they change
- Key format: `trade_tp_ticks`, `trade_sl_ticks`, `trade_tp_enabled`, `trade_sl_enabled`

