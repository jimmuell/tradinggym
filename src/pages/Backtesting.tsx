import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTier } from '@/contexts/TierContext';
import BacktestConfigPanel, { type BacktestConfig } from '@/components/backtesting/BacktestConfigPanel';
import BacktestResultsPanel from '@/components/backtesting/BacktestResultsPanel';
import BacktestRunHistory from '@/components/backtesting/BacktestRunHistory';
import BacktestTeachPanel from '@/components/backtesting/BacktestTeachPanel';
import BacktestComparePanel from '@/components/backtesting/BacktestComparePanel';
import BacktestOptimizePanel from '@/components/backtesting/BacktestOptimizePanel';
import BacktestCoachPanel from '@/components/backtesting/BacktestCoachPanel';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useBacktestRuns, useBacktestRun, useBacktestRunPoll, useCancelBacktestRun } from '@/hooks/useBacktestRuns';
import { useRunBacktest } from '@/hooks/useRunBacktest';

export default function Backtesting() {
  const navigate = useNavigate();
  const { planState, isAdmin, loading: tierLoading } = useTier();
  const effectiveTier = isAdmin ? 'admin' : planState;
  // Suppress cockpit layout branch until we actually know the plan.
  const isCockpit = !tierLoading && (effectiveTier === 'guru' || effectiveTier === 'admin');
  const { runs } = useBacktestRuns();
  const runBacktest = useRunBacktest();
  const cancelRun = useCancelBacktestRun();
  const [lastConfig, setLastConfig] = useState<BacktestConfig | null>(null);

  const latest = runs[0] ?? null;
  // Lazily fetch the FULL row (including results_detail) for the run being
  // displayed. The list query only carries slim columns, so panels that need
  // trade-by-trade JSONB (Explain/Teach/Coach) read from `latestFull` instead
  // of the list. Bounded to a single row.
  const { run: latestFull } = useBacktestRun(latest?.id ?? null);
  const displayRun = latestFull ?? latest;

  // A run is only "active" if it's pending/running AND was updated recently.
  // Anything older than 10 min is considered stuck (engine never called back)
  // and must not block the Run button — user can still cancel it explicitly.
  const STALE_MS = 10 * 60 * 1000;
  const now_ = Date.now();
  const activeRun = runs.find((r) => {
    if (r.status !== 'pending' && r.status !== 'running') return false;
    const ts = new Date((r as unknown as { updated_at?: string }).updated_at ?? r.created_at).getTime();
    return now_ - ts < STALE_MS;
  }) ?? null;
  const hasActive = !!activeRun;

  // Narrow fallback poll: only while a run is in flight, only that run's
  // id+status, with 2s/4s/8s backoff. Realtime is the primary path.
  useBacktestRunPoll(activeRun?.id ?? null);

  // Count runs created in current calendar month
  const now = new Date();
  const monthlyRunCount = runs.filter((r) => {
    const d = new Date(r.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const handleRun = async (config: BacktestConfig) => {
    if (!config.strategy) return;
    setLastConfig(config);
    const isPoints = config.stopUnit === 'points';
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
        commission_mode: 'flat_per_rt',
        commission_per_rt: config.commissionPerRt,
        run_validation: config.runValidation,
        validation_iterations: config.validationIterations,
        // Mutual exclusivity: only one stop unit is ever stored per run.
        stop_loss_pct: isPoints ? 0 : config.stopLossPct,
        take_profit_pct: isPoints ? 0 : config.takeProfitPct,
        stop_loss_points: isPoints ? config.stopLossPoints : 0,
        take_profit_points: isPoints ? config.takeProfitPoints : 0,
        slippage_ticks: config.slippageTicks,
        qty_value: config.qtyValue,
        estimated_runtime_ms: config.estimatedRuntimeMs,
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
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/strategies')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Strategies
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Backtesting</h1>
        <p className="text-sm text-muted-foreground">
          Validate your strategies against 18 years of historical MES data.
        </p>
      </div>

      <div className={cn('grid grid-cols-1 gap-4 sm:gap-6', isCockpit ? 'lg:grid-cols-[minmax(380px,480px)_1fr] xl:grid-cols-[minmax(380px,560px)_1fr]' : 'lg:grid-cols-[380px_1fr]')}>
        <BacktestConfigPanel
          onRun={handleRun}
          isRunning={runBacktest.isPending || hasActive}
          monthlyRunCount={monthlyRunCount}
          lastRun={displayRun}
        />
        <ErrorBoundary fallbackTitle="Results panel crashed — the run finished but rendering failed.">
          <div className="space-y-6">
            <BacktestResultsPanel run={displayRun} onRetry={handleRetry} onCancel={handleCancel} isCanceling={cancelRun.isPending} />
            <BacktestTeachPanel run={displayRun} />
            <div className="flex flex-wrap items-center gap-2">
              <BacktestComparePanel runs={runs} />
              <BacktestOptimizePanel runs={runs} />
              <BacktestCoachPanel run={displayRun} />
            </div>
            <BacktestRunHistory runs={runs} />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
