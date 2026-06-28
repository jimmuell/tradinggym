import { describe, it, expect } from 'vitest';
import {
  pointsToTicks,
  ticksToPoints,
  pointsToDollars,
  ticksToDollars,
  formatUSD,
} from '@/lib/mesContract';

describe('mesContract', () => {
  it('converts points <-> ticks', () => {
    expect(pointsToTicks(2)).toBe(8);
    expect(ticksToPoints(8)).toBe(2);
  });
  it('computes dollars from points and ticks', () => {
    expect(pointsToDollars(2)).toBe(10);
    expect(pointsToDollars(2, 3)).toBe(30);
    expect(ticksToDollars(4)).toBe(5);
  });
  it('formats USD', () => {
    expect(formatUSD(10)).toBe('$10.00');
  });
});
