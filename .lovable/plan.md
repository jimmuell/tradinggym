

## Analysis: MES Pricing Accuracy

### Issues Found

1. **Tick value is wrong**: Currently hardcoded as `$3.75`. MES (Micro E-mini S&P 500) tick value = tick size ($0.25) x point value ($5.00) = **$1.25 per tick per contract**. The panel should show `$1.25` per contract, or `$1.25 × units` for total tick value.

2. **TP/SL direction ignores trade side**: Currently TP is always `lastPrice + tpTicks * 0.25` (above) and SL is always `lastPrice - slTicks * 0.25` (below). This is only correct for **buys**. For **sells**, TP should be below entry and SL above.

3. **Price axis lacks `minMove` configuration**: The candlestick series doesn't specify `priceFormat` with `minMove: 0.25`, so the price axis may show non-tick-aligned values. TradingView uses `minMove: 0.25` for MES.

4. **No dollar P&L preview**: The panel shows ticks but doesn't show the estimated dollar gain/loss for TP and SL based on `ticks × $1.25 × units`.

### Plan

**File: `src/components/chart/TradeOrderPanel.tsx`**
- Fix `tickValue` to `1.25` (per contract)
- Display total tick value as `tickValue × units`
- Make TP/SL prices direction-aware:
  - Buy: TP = `lastPrice + tpTicks * 0.25`, SL = `lastPrice - slTicks * 0.25`
  - Sell: TP = `lastPrice - tpTicks * 0.25`, SL = `lastPrice + slTicks * 0.25`
- Add dollar P&L estimates under TP and SL fields: `±(ticks × $1.25 × units)`

**File: `src/components/chart/ChartContainer.tsx`**
- Add `priceFormat: { type: 'price', minMove: 0.25, precision: 2 }` to the CandlestickSeries options so the price axis snaps to tick increments
- Fix SL/TP price line calculations in the position logic to also be direction-aware

### Specs Reference (MES)
| Attribute | Value |
|-----------|-------|
| Tick size | 0.25 points |
| Point value | $5.00 |
| Tick value | $1.25 |
| Multiplier | 5 |

