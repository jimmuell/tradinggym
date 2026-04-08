

## TradingView Chart Clone

Build a full-screen TradingView-style charting interface using the `lightweight-charts` library, replicating the uploaded screenshot as closely as possible.

### Key Features

1. **Chart Core**
   - Full-screen candlestick chart using `lightweight-charts`
   - Green/red candles matching TradingView's color scheme
   - Price scale on the right with gridlines
   - Time scale on the bottom with time labels

2. **Technical Indicators**
   - Moving averages (2 lines - appears to be SMA/EMA overlays in green/blue)
   - Rendered as line series overlaid on the candlestick chart

3. **Buy/Sell Signal Markers**
   - Green "Buy" and red "Sell" labels at signal points using chart markers

4. **Top Header Bar**
   - Ticker info: "MESM2026" with timeframe selectors (1m, 15m)
   - Toolbar buttons: Indicators, Alert, Replay
   - OHLCV data display: Open, High, Low, Close, Volume
   - Bid/Ask boxes (red SELL / green BUY with prices)

5. **Left Toolbar**
   - Drawing tools sidebar icons (crosshair, trendline, etc.) - static/decorative

6. **Bottom Bar**
   - Timeframe selector chips: 1D, 5D, 1M, 3M, 6M, YTD, 1Y, All
   - Paper Trading / Trade tabs
   - Timestamp and timezone display

7. **Chart Controls**
   - Zoom +/- buttons centered at bottom of chart
   - Navigation arrows

8. **Current Price Line**
   - Horizontal dashed line at current price with price label badge (red)

9. **Styling**
   - Dark top/bottom bars, light chart background matching TradingView's theme
   - Proper fonts and spacing to match the screenshot

### Data
- Generate realistic sample candlestick data mimicking the price action shown (~6800-6850 range, intraday 1-min bars)

### Tech
- Install `lightweight-charts` package
- Single-page app on the Index route

