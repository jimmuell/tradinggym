// Pine Script v5 exporter — pure client-side string assembly.
// Reads a strategy row and returns a complete Pine Script indicator.

export interface ExportableStrategy {
  id?: string;
  name?: string | null;
  description?: string | null;
  instrument?: string | null;
  timeframe?: string | null;
  direction_bias?: string | null;
  // time
  range_start_time?: string | null;
  range_end_time?: string | null;
  trade_start_time?: string | null;
  trade_end_time?: string | null;
  eod_flat_time?: string | null;
  timezone?: string | null;
  // entry
  entry_method?: string | null;
  retest_entry_type?: string | null;
  limit_order_placement?: number | null;
  retest_stop_method?: string | null;
  range_stop_loss_pct?: number | null;
  breakout_threshold?: number | null;
  use_breakout_candle_sl?: boolean | null;
  // risk
  stop_loss_ticks?: number | null;
  take_profit_r?: number | null;
  breakeven_r?: number | null;
  // indicators / filters
  indicator_set?: Record<string, Record<string, number | boolean>> | null;
  filters?: Record<string, boolean> | null;
}

const sanitizeName = (name: string) =>
  (name || 'Strategy').replace(/[^A-Za-z0-9_\- ]/g, '').trim() || 'Strategy';

export const safeFilename = (name: string) =>
  sanitizeName(name).replace(/\s+/g, '_') + '.pine';

const parseTime = (
  t: string | null | undefined,
  fallback: { h: number; m: number },
) => {
  if (!t || typeof t !== 'string') return fallback;
  const [hh, mm] = t.split(':');
  const h = parseInt(hh ?? '', 10);
  const m = parseInt(mm ?? '', 10);
  return {
    h: Number.isFinite(h) ? h : fallback.h,
    m: Number.isFinite(m) ? m : fallback.m,
  };
};

const indicatorBlock = (
  set: Record<string, Record<string, number | boolean>>,
): { calc: string[]; plots: string[] } => {
  const calc: string[] = [];
  const plots: string[] = [];

  for (const key of Object.keys(set || {})) {
    const cfg = set[key] || {};
    if (key.startsWith('ema_')) {
      const period = (cfg.period as number) ?? parseInt(key.split('_')[1] ?? '0', 10);
      if (!period) continue;
      const v = `ema${period}`;
      calc.push(`${v} = ta.ema(close, ${period})`);
      plots.push(`plot(${v}, "EMA-${period}", color=color.yellow)`);
    } else if (key === 'vwap') {
      calc.push(`vwapValue = ta.vwap`);
      plots.push(`plot(vwapValue, "VWAP", color=color.blue)`);
    } else if (key === 'rsi') {
      const period = (cfg.period as number) ?? 14;
      calc.push(`rsiValue = ta.rsi(close, ${period})`);
      plots.push(`plot(rsiValue, "RSI-${period}", color=color.purple, display=display.pane)`);
    } else if (key === 'macd') {
      const fast = (cfg.fast as number) ?? 12;
      const slow = (cfg.slow as number) ?? 26;
      const signal = (cfg.signal as number) ?? 9;
      calc.push(`[macdLine, signalLine, histLine] = ta.macd(close, ${fast}, ${slow}, ${signal})`);
      plots.push(`plot(macdLine, "MACD", color=color.blue, display=display.pane)`);
      plots.push(`plot(signalLine, "Signal", color=color.orange, display=display.pane)`);
    } else if (key === 'bb') {
      const period = (cfg.period as number) ?? 20;
      const dev = (cfg.deviation as number) ?? 2;
      calc.push(`[bbUpper, bbBasis, bbLower] = ta.bb(close, ${period}, ${dev})`);
      plots.push(`plot(bbUpper, "BB Upper", color=color.teal)`);
      plots.push(`plot(bbBasis, "BB Basis", color=color.gray)`);
      plots.push(`plot(bbLower, "BB Lower", color=color.teal)`);
    } else if (key === 'atr') {
      const period = (cfg.period as number) ?? 14;
      calc.push(`atrValue = ta.atr(${period})`);
      plots.push(`plot(atrValue, "ATR-${period}", color=color.aqua, display=display.pane)`);
    }
  }

  return { calc, plots };
};

export function generatePineScript(strategy: ExportableStrategy): string {
  const name = sanitizeName(strategy.name || 'Untitled Strategy');
  const exportDate = new Date().toISOString().slice(0, 10);

  const rangeStart = parseTime(strategy.range_start_time, { h: 9, m: 30 });
  const rangeEnd = parseTime(strategy.range_end_time, { h: 9, m: 45 });
  const tradeStart = parseTime(strategy.trade_start_time, { h: 9, m: 45 });
  const tradeEnd = parseTime(strategy.trade_end_time, { h: 15, m: 55 });

  const direction = (strategy.direction_bias || 'Both').toLowerCase();
  const wantLong = direction === 'long' || direction === 'both';
  const wantShort = direction === 'short' || direction === 'both';

  const stopTicks = strategy.stop_loss_ticks ?? 10;
  const takeProfitR = strategy.take_profit_r ?? 2;
  const breakevenR = strategy.breakeven_r ?? 0;

  const entryMethod = (strategy.entry_method || 'on_cross').toLowerCase();
  const limitPct = strategy.limit_order_placement ?? 50;

  const indicators = indicatorBlock(strategy.indicator_set || {});

  const filterFlags = strategy.filters || {};
  const filterConds: string[] = [];
  if (filterFlags.trend_filter_ema) filterConds.push('(close > ema21)');
  if (filterFlags.no_trade_against_vwap) filterConds.push('(close > vwapValue)');
  if (filterFlags.skip_news) filterConds.push('true /* skip news handled externally */');
  if (filterFlags.skip_low_volume) filterConds.push('volume > ta.sma(volume, 20) * 0.5');
  if (filterFlags.require_higher_high) filterConds.push('high > high[1]');
  const filterExpr = filterConds.length ? ` and ${filterConds.join(' and ')}` : '';

  const lines: string[] = [];

  // Header
  lines.push(
    `// ============================================`,
    `// ${name}`,
    `// Exported from TradingGYM — ${exportDate}`,
    `// https://tradinggym.app`,
    `// ============================================`,
    `//@version=5`,
    `indicator("${name}", overlay=true, max_lines_count=500, max_boxes_count=500)`,
    ``,
  );

  // Inputs
  lines.push(
    `// === INPUTS ===`,
    `stopTicks   = input.int(${stopTicks}, "Stop Loss (ticks)", minval=1)`,
    `takeProfitR = input.float(${takeProfitR}, "Take Profit (R multiple)", minval=0.1, step=0.1)`,
    `breakevenR  = input.float(${breakevenR}, "Move to Breakeven at (R)", minval=0, step=0.1)`,
    ``,
  );

  // Indicators
  if (indicators.calc.length) {
    lines.push(`// === INDICATORS ===`);
    lines.push(...indicators.calc, ``);
  }

  // Opening range + trade window
  lines.push(
    `// === OPENING RANGE ===`,
    `rangeStartHour = ${rangeStart.h}`,
    `rangeStartMin  = ${rangeStart.m}`,
    `rangeEndHour   = ${rangeEnd.h}`,
    `rangeEndMin    = ${rangeEnd.m}`,
    `tradeStartHour = ${tradeStart.h}`,
    `tradeStartMin  = ${tradeStart.m}`,
    `tradeEndHour   = ${tradeEnd.h}`,
    `tradeEndMin    = ${tradeEnd.m}`,
    ``,
    `var float orbHigh = na`,
    `var float orbLow  = na`,
    `var float orbMid  = na`,
    `var bool  orbSet  = false`,
    ``,
    `newDay = ta.change(time("D")) != 0`,
    `if newDay`,
    `    orbHigh := na`,
    `    orbLow  := na`,
    `    orbMid  := na`,
    `    orbSet  := false`,
    ``,
    `inRange = (hour > rangeStartHour or (hour == rangeStartHour and minute >= rangeStartMin)) and (hour < rangeEndHour or (hour == rangeEndHour and minute < rangeEndMin))`,
    ``,
    `if inRange`,
    `    orbHigh := na(orbHigh) ? high : math.max(orbHigh, high)`,
    `    orbLow  := na(orbLow)  ? low  : math.min(orbLow, low)`,
    `    orbMid  := (orbHigh + orbLow) / 2`,
    ``,
    `if not inRange and not na(orbHigh)`,
    `    orbSet := true`,
    ``,
    `inTradeWindow = orbSet and (hour > tradeStartHour or (hour == tradeStartHour and minute >= tradeStartMin)) and (hour < tradeEndHour or (hour == tradeEndHour and minute < tradeEndMin))`,
    ``,
  );

  // Entry conditions
  lines.push(`// === ENTRY CONDITIONS ===`);
  if (entryMethod === 'on_close') {
    if (wantLong) lines.push(`longEntry  = close > orbHigh and close[1] <= orbHigh[1] and inTradeWindow${filterExpr}`);
    if (wantShort) lines.push(`shortEntry = close < orbLow  and close[1] >= orbLow[1]  and inTradeWindow${filterExpr}`);
  } else if (entryMethod === 'on_retest') {
    lines.push(
      `var bool longBreakout  = false`,
      `var bool shortBreakout = false`,
      `if newDay`,
      `    longBreakout  := false`,
      `    shortBreakout := false`,
      `if not na(orbHigh) and close > orbHigh`,
      `    longBreakout := true`,
      `if not na(orbLow) and close < orbLow`,
      `    shortBreakout := true`,
      `retestLongLevel  = orbHigh - (orbHigh - orbMid) * (${limitPct} / 100.0)`,
      `retestShortLevel = orbLow  + (orbMid - orbLow) * (${limitPct} / 100.0)`,
    );
    if (wantLong) lines.push(`longEntry  = longBreakout  and low  <= retestLongLevel  and close > retestLongLevel  and inTradeWindow${filterExpr}`);
    if (wantShort) lines.push(`shortEntry = shortBreakout and high >= retestShortLevel and close < retestShortLevel and inTradeWindow${filterExpr}`);
  } else {
    if (wantLong) lines.push(`longEntry  = ta.crossover(close, orbHigh) and inTradeWindow${filterExpr}`);
    if (wantShort) lines.push(`shortEntry = ta.crossunder(close, orbLow) and inTradeWindow${filterExpr}`);
  }
  if (!wantLong) lines.push(`longEntry  = false`);
  if (!wantShort) lines.push(`shortEntry = false`);
  lines.push(``);

  // Risk levels
  lines.push(
    `// === RISK LEVELS ===`,
    `entryPrice  = close`,
    `longStop    = entryPrice - (stopTicks * syminfo.mintick)`,
    `longTarget  = entryPrice + (stopTicks * takeProfitR * syminfo.mintick)`,
    `shortStop   = entryPrice + (stopTicks * syminfo.mintick)`,
    `shortTarget = entryPrice - (stopTicks * takeProfitR * syminfo.mintick)`,
    ``,
  );

  // Plots
  lines.push(
    `// === PLOTS ===`,
    `plot(orbHigh, "ORB High", color=color.green, style=plot.style_linebr)`,
    `plot(orbLow,  "ORB Low",  color=color.red,   style=plot.style_linebr)`,
    `plot(orbMid,  "ORB Mid",  color=color.gray,  style=plot.style_linebr)`,
    ``,
  );
  if (indicators.plots.length) lines.push(...indicators.plots, ``);

  lines.push(
    `plotshape(longEntry,  "Long Signal",  shape.triangleup,   location.belowbar, color.green, size=size.small)`,
    `plotshape(shortEntry, "Short Signal", shape.triangledown, location.abovebar, color.red,   size=size.small)`,
    ``,
  );

  // Alerts
  lines.push(
    `// === ALERTS ===`,
    `alertcondition(longEntry,  title="Long Entry",  message="TradingGYM: ${name} — Long entry signal")`,
    `alertcondition(shortEntry, title="Short Entry", message="TradingGYM: ${name} — Short entry signal")`,
    ``,
  );

  return lines.join('\n');
}
