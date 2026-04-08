import { CandlestickData, Time } from 'lightweight-charts';

function generateCandlestickData(): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const baseTime = new Date('2026-04-08T05:00:00').getTime() / 1000;
  let price = 6825;

  // Phase 1: sideways with slight up (05:00 - 06:30)
  for (let i = 0; i < 90; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.5) * 2;
    const close = open + (Math.random() - 0.48) * 3;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    data.push({ time, open, high, low, close });
    price = close;
  }

  // Phase 2: big move up (06:30 - 07:30)
  for (let i = 90; i < 150; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.3) * 2;
    const close = open + (Math.random() - 0.2) * 5;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 1;
    data.push({ time, open, high, low, close });
    price = close;
  }

  // Phase 3: sharp sell-off (07:30 - 09:30)
  for (let i = 150; i < 270; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.6) * 3;
    const close = open + (Math.random() - 0.7) * 5;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    data.push({ time, open, high, low, close });
    price = close;
  }

  // Phase 4: recovery (09:30 - 11:00)
  for (let i = 270; i < 360; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.4) * 2;
    const close = open + (Math.random() - 0.3) * 4;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 1;
    data.push({ time, open, high, low, close });
    price = close;
  }

  // Phase 5: continuation choppy (11:00 - 15:00)
  for (let i = 360; i < 600; i++) {
    const time = (baseTime + i * 60) as Time;
    const open = price + (Math.random() - 0.5) * 2;
    const close = open + (Math.random() - 0.5) * 3;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    data.push({ time, open, high, low, close });
    price = close;
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

  // Place signals at local highs/lows
  for (let i = 10; i < candles.length - 10; i += Math.floor(Math.random() * 40 + 30)) {
    const isLocalHigh = candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high;
    const isLocalLow = candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low;

    if (isLocalHigh) {
      markers.push({
        time: candles[i].time,
        position: 'aboveBar',
        color: '#ef5350',
        shape: 'arrowDown',
        text: 'Sell',
      });
    } else if (isLocalLow) {
      markers.push({
        time: candles[i].time,
        position: 'belowBar',
        color: '#26a69a',
        shape: 'arrowUp',
        text: 'Buy',
      });
    } else {
      // alternate
      if (markers.length % 2 === 0) {
        markers.push({
          time: candles[i].time,
          position: 'belowBar',
          color: '#26a69a',
          shape: 'arrowUp',
          text: 'Buy',
        });
      } else {
        markers.push({
          time: candles[i].time,
          position: 'aboveBar',
          color: '#ef5350',
          shape: 'arrowDown',
          text: 'Sell',
        });
      }
    }
  }

  return markers;
}

export const candlestickData = generateCandlestickData();
