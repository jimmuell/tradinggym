import { useState } from 'react';
import { toast } from 'sonner';
import BacktestConfigPanel, { type BacktestConfig } from '@/components/backtesting/BacktestConfigPanel';
import BacktestResultsPanel from '@/components/backtesting/BacktestResultsPanel';
import BacktestRunHistory from '@/components/backtesting/BacktestRunHistory';
import { useBacktestRuns, useCancelBacktestRun } from '@/hooks/useBacktestRuns';
import { useRunBacktest } from '@/hooks/useRunBacktest';

export default function Backtesting() {
  const { runs } = useBacktestRuns();
  const runBacktest = useRunBacktest();
  const cancelRun = useCancelBacktestRun();
  const [lastConfig, setLastConfig] = useState<BacktestConfig | null>(null);

  const latest = runs[0] ?? null;
  const hasActive = runs.some((r) => r.status === 'pending' || r.status === 'running');

  // Count runs created in current calendar month
  const now = new Date();
  const monthlyRunCount = runs.filter((r) => {
    const d = new Date(r.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const handleRun = async (config: BacktestConfig) => {
    if (!config.strategy) return;
    setLastConfig(config);
    try {
      await runBacktest.mutateAsync({
        strategy_id: config.strategy.id,
        strategy_name: config.strategy.name,
        timeframe: config.timeframe,
        start_date: config.startDate,
        end_date: config.endDate,
        initial_balance: config.initialBalance,
        stop_loss_ticks: 0,
        take_profit_ticks: 0,
        max_trades_per_day: 10,
        direction: config.direction,
        commission_pct: config.commissionPct,
      });
      toast.success('Backtest started — results will appear shortly');
    } catch (err) {
      toast.error(`Failed to start backtest: ${(err as Error).message}`);
    }
  };

  const handleRetry = () => {
    if (lastConfig) handleRun(lastConfig);
  };

  const handleCancel = async () => {
    try {
      await cancelRun.mutateAsync(latest?.status === 'pending' || latest?.status === 'running' ? latest.id : undefined);
      toast.success('Backtest canceled');
    } catch (err) {
      toast.error(`Cancel failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Backtesting</h1>
        <p className="text-sm text-muted-foreground">
          Validate your strategies against 18 years of historical MES data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 sm:gap-6">
        <BacktestConfigPanel
          onRun={handleRun}
          isRunning={runBacktest.isPending || hasActive}
          monthlyRunCount={monthlyRunCount}
        />
        <div className="space-y-6">
          <BacktestResultsPanel run={latest} onRetry={handleRetry} onCancel={handleCancel} isCanceling={cancelRun.isPending} />
          <BacktestRunHistory runs={runs} />
        </div>
      </div>
    </div>
  );
}
