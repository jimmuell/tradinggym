export const INSTRUMENTS = {
  MES: {
    label: 'MES',
    name: 'Micro E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 1.25,
    pointValue: 5.00,
  },
  ES: {
    label: 'ES',
    name: 'E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 12.50,
    pointValue: 50.00,
  },
} as const;

export type InstrumentKey = keyof typeof INSTRUMENTS;
