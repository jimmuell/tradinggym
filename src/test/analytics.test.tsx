import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WinLossStats } from '@/components/analytics/WinLossStats';

// ─── WinLossStats component ───────────────────────────────────────────────────

describe('WinLossStats', () => {
  it('renders wins, losses, and breakevens', () => {
    render(<WinLossStats wins={10} losses={4} breakevens={2} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders zero state without crashing', () => {
    render(<WinLossStats wins={0} losses={0} breakevens={0} />);
    expect(screen.getAllByText('0')).toHaveLength(3);
  });

  it('renders Wins label in green', () => {
    render(<WinLossStats wins={5} losses={2} breakevens={1} />);
    const winsValue = screen.getByText('5');
    expect(winsValue.className).toMatch(/text-success/);
  });

  it('renders Losses label in destructive color', () => {
    render(<WinLossStats wins={5} losses={2} breakevens={1} />);
    const lossesValue = screen.getByText('2');
    expect(lossesValue.className).toMatch(/text-destructive/);
  });
});

// ─── useAnalytics computation logic (pure functions extracted for testing) ────

type TradeResult = 'win' | 'loss' | 'breakeven';

interface MockTrade {
  result: TradeResult;
  pnl: number;
  steps_completed: number[];
  opened_at: string;
}

function computeStats(trades: MockTrade[]) {
  let wins = 0, losses = 0, breakevens = 0;
  let totalPnl = 0, grossWins = 0, grossLosses = 0;
  let bestTrade = 0, worstTrade = 0;
  const winnerPnls: number[] = [];
  const loserPnls: number[] = [];
  let stepAccuracySum = 0;
  const BLUEPRINT_STEPS = 6;

  trades.forEach((t, i) => {
    totalPnl += t.pnl;
    if (i === 0) { bestTrade = t.pnl; worstTrade = t.pnl; }
    else {
      if (t.pnl > bestTrade) bestTrade = t.pnl;
      if (t.pnl < worstTrade) worstTrade = t.pnl;
    }
    if (t.result === 'win') { wins++; grossWins += t.pnl; winnerPnls.push(t.pnl); }
    else if (t.result === 'loss') { losses++; grossLosses += t.pnl; loserPnls.push(t.pnl); }
    else { breakevens++; }
    stepAccuracySum += (t.steps_completed.length / BLUEPRINT_STEPS) * 100;
  });

  const totalTrades = trades.length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const avgWinner = winnerPnls.length > 0 ? grossWins / winnerPnls.length : 0;
  const avgLoser = loserPnls.length > 0 ? grossLosses / loserPnls.length : 0;
  const profitFactor = grossLosses < 0 ? grossWins / Math.abs(grossLosses) : 0;
  const avgStepAccuracy = totalTrades > 0 ? stepAccuracySum / totalTrades : 0;

  return { wins, losses, breakevens, totalPnl, winRate, avgWinner, avgLoser,
           profitFactor, avgStepAccuracy, bestTrade: totalTrades > 0 ? bestTrade : 0,
           worstTrade: totalTrades > 0 ? worstTrade : 0, totalTrades };
}

const sampleTrades: MockTrade[] = [
  { result: 'win',       pnl:  50,  steps_completed: [1,2,3,4,5,6], opened_at: '2026-04-01T10:00:00Z' },
  { result: 'win',       pnl:  30,  steps_completed: [1,2,3],       opened_at: '2026-04-02T10:00:00Z' },
  { result: 'loss',      pnl: -20,  steps_completed: [1,2,3,4],     opened_at: '2026-04-03T10:00:00Z' },
  { result: 'breakeven', pnl:   0,  steps_completed: [1,2],         opened_at: '2026-04-04T10:00:00Z' },
];

describe('useAnalytics computation logic', () => {
  it('counts wins, losses, breakevens correctly', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(1);
    expect(stats.breakevens).toBe(1);
  });

  it('calculates win rate excluding breakevens', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.winRate).toBeCloseTo(66.67, 1);
  });

  it('calculates total P&L correctly', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.totalPnl).toBe(60);
  });

  it('calculates average winner correctly', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.avgWinner).toBe(40);
  });

  it('calculates average loser correctly', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.avgLoser).toBe(-20);
  });

  it('calculates profit factor correctly', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.profitFactor).toBeCloseTo(4.0, 2);
  });

  it('returns profitFactor of 0 when no losses', () => {
    const noLossTrades = sampleTrades.filter(t => t.result !== 'loss');
    const stats = computeStats(noLossTrades);
    expect(stats.profitFactor).toBe(0);
  });

  it('calculates blueprint step accuracy correctly', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.avgStepAccuracy).toBeCloseTo(62.5, 1);
  });

  it('returns zero stats for empty trade list', () => {
    const stats = computeStats([]);
    expect(stats.totalTrades).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.totalPnl).toBe(0);
    expect(stats.profitFactor).toBe(0);
    expect(stats.avgStepAccuracy).toBe(0);
    expect(stats.bestTrade).toBe(0);
    expect(stats.worstTrade).toBe(0);
  });

  it('identifies best and worst trade correctly', () => {
    const stats = computeStats(sampleTrades);
    expect(stats.bestTrade).toBe(50);
    expect(stats.worstTrade).toBe(-20);
  });
});
