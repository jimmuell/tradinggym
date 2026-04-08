import { CandlestickData, Time } from 'lightweight-charts';

export type Timeframe = '1m' | '5m' | '30m' | '1h' | '1D';

const timeframeFileMap: Record<Timeframe, string> = {
  '1m': '/data/ES_1min.csv',
  '5m': '/data/ES_5min.csv',
  '30m': '/data/ES_30min.csv',
  '1h': '/data/ES_1hour.csv',
  '1D': '/data/ES_1day.csv',
};

function parseCSV(csv: string, timeframe: Timeframe): CandlestickData<Time>[] {
  const lines = csv.trim().split('\n');
  const data: CandlestickData<Time>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;

    const timestamp = parts[0].trim();
    const open = parseFloat(parts[1]);
    const high = parseFloat(parts[2]);
    const low = parseFloat(parts[3]);
    const close = parseFloat(parts[4]);

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

    let time: Time;
    if (timeframe === '1D') {
      // Daily data: use date string "YYYY-MM-DD"
      time = timestamp.split(' ')[0] as Time;
    } else {
      // Intraday: use unix timestamp
      time = (new Date(timestamp).getTime() / 1000) as Time;
    }

    data.push({ time, open, high, low, close });
  }

  return data;
}

const cache: Partial<Record<Timeframe, CandlestickData<Time>[]>> = {};

export async function loadTimeframeData(tf: Timeframe): Promise<CandlestickData<Time>[]> {
  if (cache[tf]) return cache[tf]!;
  const res = await fetch(timeframeFileMap[tf]);
  const csv = await res.text();
  const data = parseCSV(csv, tf);
  cache[tf] = data;
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
