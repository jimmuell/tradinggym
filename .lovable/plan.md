

# Replace Hero Chart Animation with Candlestick Visualization

## Summary
Replace the current line chart SVG animation with an animated candlestick chart that draws candles one-by-one from left to right, matching the trading theme of the app.

## Changes

| File | Change |
|------|--------|
| `src/components/landing/HeroChartAnimation.tsx` | Rewrite to render SVG candlesticks instead of a line path. Each candle (body + wicks) animates in sequentially with a staggered fade/scale-in effect. Green candles for up, red for down. Keeps the grid background and 30% opacity aesthetic. |

## Animation Design
- ~30 OHLC data points with a realistic price action pattern (uptrend with pullbacks)
- Each candle is an SVG `<rect>` (body) + `<line>` (wick), colored green (close > open) or red (close < open)
- Candles appear one-by-one left-to-right using CSS `animation-delay` with `fade-in` + `scale-in` keyframes
- Total animation duration ~3 seconds (matching current line draw timing)
- Same container positioning, opacity, and `pointer-events-none` behavior as current

