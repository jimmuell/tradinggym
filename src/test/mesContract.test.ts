import { describe, it, expect } from 'vitest';
import { pointsToTicks, pointsToDollars, ticksToDollars } from '@/lib/mesContract';

describe('MES contract math', () => {
  it('points -> ticks (4 ticks/pt)', () => {
    expect(pointsToTicks(5)).toBe(20);
    expect(pointsToTicks(0.25)).toBe(1);
  });
  it('points -> dollars/contract ($5/pt)', () => {
    expect(pointsToDollars(5)).toBe(25);
    expect(pointsToDollars(5, 3)).toBe(75);
  });
  it('ticks -> dollars/contract ($1.25/tick)', () => {
    expect(ticksToDollars(2)).toBe(2.5);
    expect(ticksToDollars(2, 4)).toBe(10);
  });
  it('zero is zero', () => {
    expect(pointsToDollars(0)).toBe(0);
    expect(ticksToDollars(0)).toBe(0);
  });
});
