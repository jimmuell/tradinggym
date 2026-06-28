import { useState } from 'react';
import { CalendarRange, Lock, Loader2, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStrategies, type Strategy } from '@/hooks/useStrategies';
import { useTier } from '@/contexts/TierContext';
import { pointsToDollars, ticksToDollars, formatUSD } from '@/lib/mesContract';

export type StopUnit = 'percent' | 'points';

export interface BacktestConfig {
  strategy: Strategy | null;
  startDate: string;
  endDate: string;
  initialBalance: number;
  commissionPct: number;
  direction: 'long_short' | 'long_only';
  timeframe: string;
  runValidation: boolean;
  validationIterations: number;
  stopUnit: StopUnit;
  stopLossPct: number;
  takeProfitPct: number;
  stopLossPoints: number;
  takeProfitPoints: number;
  slippageTicks: number;
  qtyValue: number;
  forceRegenerate: boolean;
}

const ITERATION_STOPS = [
  { value: 500,   label: '500',    hint: '≈2.8s' },
  { value: 2000,  label: '2,000',  hint: '≈3.2s' },
  { value: 10000, label: '10,000', hint: '≈6.1s' },
] as const;
const VALIDATION_ITERATIONS_DEFAULT = 2000;

interface Props {
  onRun: (config: BacktestConfig) => void;
  isRunning: boolean;
  monthlyRunCount: number;
}

const PRO_MONTHLY_LIMIT = 5;

export default function BacktestConfigPanel({ onRun, isRunning, monthlyRunCount }: Props) {
  const navigate = useNavigate();
  const { planState, isAdmin } = useTier();
  const { strategies, isLoading } = useStrategies();

  const isStarter = planState === 'starter';
  const isPro = planState === 'pro';
  const isUnlimited = planState === 'expert' || planState === 'guru' || planState === 'admin';
  const remaining = isPro ? Math.max(0, PRO_MONTHLY_LIMIT - monthlyRunCount) : null;
  const outOfCredits = isPro && remaining === 0;

  const [strategyId, setStrategyId] = useState<string>('');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [initialBalance, setInitialBalance] = useState(10000);
  const [commissionPct, setCommissionPct] = useState(0.1);
  const [direction, setDirection] = useState<'long_short' | 'long_only'>('long_short');
  const [runValidation, setRunValidation] = useState(true);
  const [validationIterations, setValidationIterations] = useState(VALIDATION_ITERATIONS_DEFAULT);
  const [stopLossPct, setStopLossPct] = useState(0);
  const [takeProfitPct, setTakeProfitPct] = useState(0);
  const [stopUnit, setStopUnit] = useState<StopUnit>('percent');
  const [stopLossPoints, setStopLossPoints] = useState(0);
  const [takeProfitPoints, setTakeProfitPoints] = useState(0);
  const [slippageTicks, setSlippageTicks] = useState(0);
  const [qtyValue, setQtyValue] = useState(1);
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const sliderIndex = Math.max(0, ITERATION_STOPS.findIndex((s) => s.value === validationIterations));

  const applyQuickTestWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday - 7); // previous Monday
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setStartDate(fmt(monday));
    setEndDate(fmt(friday));
  };

  const selectedStrategy = strategies.find((s) => s.id === strategyId) || null;
  const canSubmit = !!selectedStrategy && !isRunning && !isStarter && !outOfCredits;

  const handleRun = () => {
    if (!canSubmit) return;
    onRun({
      strategy: selectedStrategy,
      startDate,
      endDate,
      initialBalance,
      commissionPct,
      direction,
      timeframe: '5min',
      runValidation,
      validationIterations,
      stopUnit,
      stopLossPct,
      takeProfitPct,
      stopLossPoints,
      takeProfitPoints,
      slippageTicks,
      qtyValue,
      forceRegenerate,
    });
    // One-shot: forcing is a deliberate per-run action; don't let it persist into the next run.
    if (forceRegenerate) setForceRegenerate(false);
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>Configure Backtest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Strategy</Label>
          <Select value={strategyId} onValueChange={setStrategyId} disabled={isStarter || isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a strategy'} />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
              {strategies.length === 0 && !isLoading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No strategies yet</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isStarter} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isStarter} />
          </div>
        </div>

        <div className="flex justify-end -mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyQuickTestWeek}
            disabled={isStarter}
            className="gap-1.5"
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Quick test (1 week)
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Initial Balance ($)</Label>
            <Input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(Number(e.target.value))}
              disabled={isStarter}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label>Commission %</Label>
            <Input
              type="number"
              step="0.01"
              value={commissionPct}
              onChange={(e) => setCommissionPct(Number(e.target.value))}
              disabled={isStarter}
              className="tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v: 'long_short' | 'long_only') => setDirection(v)} disabled={isStarter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long_short">Long & Short</SelectItem>
                <SelectItem value="long_only">Long Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Input value="5-min" disabled className="tabular-nums" />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <Label>Risk & execution</Label>
              <p className="text-xs text-muted-foreground">
                Engine-level exits and size. Leave stop/target at 0 to let the strategy handle its own exits.
              </p>
            </div>
            <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStopUnit('percent')}
                disabled={isStarter}
                className={`px-2 py-1 rounded-sm transition-colors ${stopUnit === 'percent' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Percent
              </button>
              <button
                type="button"
                onClick={() => setStopUnit('points')}
                disabled={isStarter}
                className={`px-2 py-1 rounded-sm transition-colors ${stopUnit === 'points' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Points
              </button>
            </div>
          </div>

          {stopUnit === 'percent' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="stop-loss-pct" className="text-xs">Stop loss (% from entry)</Label>
                <Input id="stop-loss-pct" type="number" min={0} max={100} step={0.1}
                  value={stopLossPct}
                  onChange={(e) => setStopLossPct(Math.max(0, Number(e.target.value) || 0))}
                  disabled={isStarter} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="take-profit-pct" className="text-xs">Take profit (% from entry)</Label>
                <Input id="take-profit-pct" type="number" min={0} step={0.1}
                  value={takeProfitPct}
                  onChange={(e) => setTakeProfitPct(Math.max(0, Number(e.target.value) || 0))}
                  disabled={isStarter} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="stop-loss-points" className="text-xs">Stop loss (points)</Label>
                <Input id="stop-loss-points" type="number" min={0} step={0.25}
                  value={stopLossPoints}
                  onChange={(e) => setStopLossPoints(Math.max(0, Number(e.target.value) || 0))}
                  disabled={isStarter} />
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {stopLossPoints} pts = {formatUSD(pointsToDollars(stopLossPoints))} / contract
                  {qtyValue > 1 && ` · × ${qtyValue} = ${formatUSD(pointsToDollars(stopLossPoints, qtyValue))}`}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="take-profit-points" className="text-xs">Take profit (points)</Label>
                <Input id="take-profit-points" type="number" min={0} step={0.25}
                  value={takeProfitPoints}
                  onChange={(e) => setTakeProfitPoints(Math.max(0, Number(e.target.value) || 0))}
                  disabled={isStarter} />
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {takeProfitPoints} pts = {formatUSD(pointsToDollars(takeProfitPoints))} / contract
                  {qtyValue > 1 && ` · × ${qtyValue} = ${formatUSD(pointsToDollars(takeProfitPoints, qtyValue))}`}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty-value" className="text-xs">Position size (contracts)</Label>
              <Input id="qty-value" type="number" min={1} step={1}
                value={qtyValue}
                onChange={(e) => setQtyValue(Math.max(1, Math.trunc(Number(e.target.value) || 1)))}
                disabled={isStarter} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slippage-ticks" className="text-xs" title="Adverse slippage applied to every fill, like TradingView's slippage setting. 0 = none.">
                Slippage (ticks)
              </Label>
              <Input id="slippage-ticks" type="number" min={0} step={1}
                value={slippageTicks}
                onChange={(e) => setSlippageTicks(Math.max(0, Number(e.target.value) || 0))}
                onBlur={(e) => setSlippageTicks(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                disabled={isStarter} />
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {slippageTicks} ticks = {formatUSD(ticksToDollars(slippageTicks))} / contract per fill
              </p>
            </div>
          </div>
        </div>


        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="run-validation">Statistical validation</Label>
              <p className="text-xs text-muted-foreground">
                Run the engine's honest validation layer on the results.
              </p>
            </div>
            <Switch
              id="run-validation"
              checked={runValidation}
              onCheckedChange={setRunValidation}
              disabled={isStarter}
            />
          </div>

          <div className={runValidation ? '' : 'opacity-50 pointer-events-none'}>
            <div className="space-y-2 pt-1">
              <Label className="text-xs">Iterations</Label>
              <Slider
                min={0}
                max={ITERATION_STOPS.length - 1}
                step={1}
                value={[sliderIndex]}
                onValueChange={([i]) => setValidationIterations(ITERATION_STOPS[i].value)}
                disabled={!runValidation || isStarter}
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
                {ITERATION_STOPS.map((s) => (
                  <span key={s.value} className={s.value === validationIterations ? 'text-foreground font-medium' : ''}>
                    {s.label} <span className="opacity-70">{s.hint}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="force-regenerate">Force-regenerate signal</Label>
              <p className="text-xs text-muted-foreground">
                Admin only. Ignores the cached signal and regenerates it via Claude for this run,
                then re-caches. Use after editing the system prompt or when a cached signal looks
                wrong. Resets after each run.
              </p>
            </div>
            <Switch
              id="force-regenerate"
              checked={forceRegenerate}
              onCheckedChange={setForceRegenerate}
            />
          </div>
        )}

        {isPro && (
          <p className="text-xs text-muted-foreground">
            {remaining} of {PRO_MONTHLY_LIMIT} monthly backtests remaining
          </p>
        )}
        {isUnlimited && (
          <p className="text-xs text-muted-foreground">Unlimited backtests on your plan</p>
        )}

        <Button onClick={handleRun} disabled={!canSubmit} className="w-full" size="lg">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running backtest…
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Backtest
            </>
          )}
        </Button>

        {outOfCredits && (
          <p className="text-xs text-center text-red-500">
            Monthly limit reached. Upgrade to Expert for unlimited backtests.
          </p>
        )}
      </CardContent>

      {isStarter && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
          <div className="text-center space-y-4 p-6 max-w-md">
            <div className="mx-auto rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Backtesting is a Pro feature
            </h3>
            <p className="text-sm text-muted-foreground">
              Validate your strategies against 18 years of historical MES data
            </p>
            <Button size="lg" onClick={() => navigate('/pricing?highlight=pro')} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro — $29/mo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
