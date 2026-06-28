// MES contract economics. Engine canonical unit is index points.
export const MES_POINT_VALUE = 5;    // $ per index point per contract
export const MES_TICK_SIZE = 0.25;   // points per tick (4 ticks = 1 point)

export const pointsToTicks   = (pts: number) => pts / MES_TICK_SIZE;          // 1 pt -> 4 ticks
export const pointsToDollars = (pts: number, qty = 1) => pts * MES_POINT_VALUE * qty;
export const ticksToDollars  = (ticks: number, qty = 1) =>
  ticks * MES_TICK_SIZE * MES_POINT_VALUE * qty;                              // 1 tick -> $1.25
