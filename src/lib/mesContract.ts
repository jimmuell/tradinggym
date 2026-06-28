// MES (Micro E-mini S&P 500) contract economics — single source of truth.
export const MES_POINT_VALUE = 5;        // $ per point per contract
export const MES_TICK_SIZE = 0.25;       // points per tick
export const MES_TICK_VALUE = 1.25;      // $ per tick per contract
export const TICKS_PER_POINT = 4;

export const pointsToTicks = (points: number) => Math.round(points * TICKS_PER_POINT);
export const ticksToPoints = (ticks: number) => ticks / TICKS_PER_POINT;
export const pointsToDollars = (points: number, qty = 1) => points * MES_POINT_VALUE * qty;
export const ticksToDollars = (ticks: number, qty = 1) => ticks * MES_TICK_VALUE * qty;

export const formatUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
