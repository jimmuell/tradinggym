import { CandlestickData, Time } from 'lightweight-charts';

function generateCandlestickData(): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const baseTime = new Date('2026-04-08T05:00:00').getTime() / 1000;
  let price = 6835;

  // Phase 1: sideways choppy (05:00 - 06:00) ~6830-6840
  for (let i = 0; i < 60; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.5) * 1.5;
    const close = open + (Math.random() - 0.48) * 2;
    const high = Math.max(open, close) + Math.random() * 1;
    const low = Math.min(open, close) - Math.random() * 1;
    data.push({ time, open, high, low, close });
    price = close;
  }

  // Phase 2: move up to ~6848 (06:00 - 07:00)
  for (let i = 60; i < 120; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.3) * 1.5;
    const close = open + (Math.random() - 0.2) * 2.5;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 0.8;
    data.push({ time, open, high, low, close });
    price = Math.min(close, 6852);
  }

  // Phase 3: sell-off from ~6850 down to ~6790 (07:00 - 09:30)
  for (let i = 120; i < 270; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.6) * 2;
    const close = open + (Math.random() - 0.65) * 3;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    data.push({ time, open, high, low, close });
    price = Math.max(close, 6785);
  }

  // Phase 4: recovery from ~6790 to ~6815 (09:30 - 11:00)
  for (let i = 270; i < 360; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.35) * 1.5;
    const close = open + (Math.random() - 0.3) * 2.5;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1;
    data.push({ time, open, high, low, close });
    price = Math.min(close, 6828);
  }

  // Phase 5: choppy around 6820-6828 (11:00 - 15:00)
  for (let i = 360; i < 600; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.5) * 1.5;
    const close = open + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random() * 1;
    const low = Math.min(open, close) - Math.random() * 1;
    data.push({ time, open, high, low, close });
    price = 6823 + (Math.random() - 0.5) * 6;
  }

  return data;
}

export function getSMAData(candles: CandlestickData<Time>[], period: number) {
  const result: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
}

export function getEMAData(candles: CandlestickData<Time>[], period: number) {
  const result: { time: Time; value: number }[] = [];
  const k = 2 / (period + 1);
  let ema = candles[0].close;
  for (let i = 0; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    if (i >= period - 1) {
      result.push({ time: candles[i].time, value: ema });
    }
  }
  return result;
}

export function getBuySellSignals(candles: CandlestickData<Time>[]) {
  const markers: Array<{
    time: Time;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'arrowDown' | 'arrowUp';
    text: string;
  }> = [];

  // Place Buy/Sell at specific intervals matching reference pattern
  const signalPoints = [
    { idx: 15, type: 'buy' },
    { idx: 35, type: 'sell' },
    { idx: 55, type: 'sell' },
    { idx: 80, type: 'sell' },
    { idx: 105, type: 'buy' },
    { idx: 160, type: 'sell' },
    { idx: 220, type: 'sell' },
    { idx: 280, type: 'buy' },
    { idx: 310, type: 'buy' },
  ];

  for (const sp of signalPoints) {
    if (sp.idx >= candles.length) continue;
    if (sp.type === 'buy') {
      markers.push({
        time: candles[sp.idx].time,
        position: 'belowBar',
        color: '#26a69a',
        shape: 'arrowUp',
        text: 'Buy',
      });
    } else {
      markers.push({
        time: candles[sp.idx].time,
        position: 'aboveBar',
        color: '#ef5350',
        shape: 'arrowDown',
        text: 'Sell',
      });
    }
  }

  return markers;
}

export const candlestickData = generateCandlestickData();
