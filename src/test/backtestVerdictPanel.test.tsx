import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BacktestVerdictPanel from '@/components/backtesting/BacktestVerdictPanel';
import type { BacktestRun, BacktestValidation } from '@/hooks/useBacktestRuns';

const baseRun: BacktestRun = {
  id: 'r1',
  user_id: 'u1',
  strategy_id: null,
  strategy_name: 'EMA cross',
  timeframe: '5m',
  start_date: '2008-01-01',
  end_date: '2026-01-01',
  initial_balance: 10000,
  stop_loss_ticks: 10,
  take_profit_ticks: 20,
  max_trades_per_day: 5,
  total_trades: 120,
  wins: 60,
  losses: 60,
  net_pnl: 1500,
  win_rate: 50,
  profit_factor: 1.2,
  max_drawdown: -800,
  avg_winner: 120,
  avg_loser: -90,
  status: 'complete',
  created_at: '2026-06-26T00:00:00Z',
  strategy_config: null,
  results_detail: null,
  equity_curve: null,
  ai_signal_code: null,
  error_message: null,
  engine_version: '1.4.0',
  execution_time_ms: 4200,
  direction: 'long_short',
  commission_pct: 0.1,
};

const validation: BacktestValidation = {
  overall: 'caution',
  summary:
    'Edge is weak after accounting for multiple testing; results are not statistically distinguishable from noise at the 95% level.',
  findings: [
    { key: 'mt', title: 'Multiple Testing', status: 'caution', headline: 'Adjusted p-value 0.18', detail: 'After Bonferroni correction the edge is not significant.', stat: 0.18 },
    { key: 'oos', title: 'Out-of-Sample', status: 'fail', headline: 'OOS expectancy negative', detail: 'Hold-out period lost money.', stat: -12.5 },
    { key: 'turn', title: 'Turnover', status: 'pass', headline: 'Costs are sustainable', detail: 'Commission drag is acceptable.', stat: null },
    { key: 'reg', title: 'Regime Spread', status: 'inconclusive', headline: 'Too few trades per regime', detail: 'Some regimes have <30 trades.', stat: null },
    { key: 'info', title: 'Data Coverage', status: 'info', headline: '18 years covered', detail: 'Full sample used.', stat: 18 },
  ],
  regimes: {
    volatility: {
      trade_counts: { low: 40, high: 80 },
      per_regime: {
        low: { n_trades: 40, expectancy: 5.2, win_rate: 0.55, net_profit: 208 },
        high: { n_trades: 80, expectancy: -1.1, win_rate: 0.46, net_profit: -88 },
      },
    },
  },
  skipped: ['monte_carlo'],
};

describe('BacktestVerdictPanel', () => {
  it('renders the overall badge, summary verbatim, all 5 findings, and regimes', () => {
    render(<BacktestVerdictPanel run={{ ...baseRun, validation }} />);

    // Overall badge uses the restrained label for caution (also appears as a
    // finding chip — at least one present)
    expect(screen.getAllByText('Caution').length).toBeGreaterThanOrEqual(1);
    // Summary shown verbatim (incl. the multiple-testing caveat), not truncated
    expect(screen.getByText(validation.summary)).toBeInTheDocument();
    // All five findings present (titles + headlines verbatim)
    for (const f of validation.findings) {
      expect(screen.getByText(f.title)).toBeInTheDocument();
      expect(screen.getByText(f.headline)).toBeInTheDocument();
    }
    // Pass state renders as "Promising", never "PASS"
    expect(screen.getAllByText('Promising').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('PASS')).not.toBeInTheDocument();
    // Regime scheme + labels present
    expect(screen.getByText('volatility')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    // Skipped checks listed
    expect(screen.getByText(/Skipped: monte_carlo/)).toBeInTheDocument();
  });

  it('shows validation_error plainly when present', () => {
    render(
      <BacktestVerdictPanel
        run={{ ...baseRun, validation: null, validation_error: 'engine OOM during bootstrap' }}
      />,
    );
    expect(
      screen.getByText(/validation could not be computed: engine OOM during bootstrap/),
    ).toBeInTheDocument();
  });

  it('does not crash on older runs with no validation', () => {
    render(<BacktestVerdictPanel run={{ ...baseRun, validation: null, validation_error: null }} />);
    expect(screen.getByText('No validation verdict for this run.')).toBeInTheDocument();
  });
});
