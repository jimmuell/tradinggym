export const PRACTICE_STARTING_BALANCE = 10000;

// Dollar value of one full index point, per contract.
// MES: 1 point = $5.00 (tick = 0.25 pt = $1.25)
export const POINT_VALUE_USD = 5;

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
