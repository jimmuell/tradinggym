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
}

const VALIDATION_ITERATIONS_MIN = 100;
const VALIDATION_ITERATIONS_MAX = 20000;
const VALIDATION_ITERATIONS_DEFAULT = 2000;

interface Props {
  onRun: (config: BacktestConfig) => void;
  isRunning: boolean;
  monthlyRunCount: number;
}

const PRO_MONTHLY_LIMIT = 5;

export default function BacktestConfigPanel({ onRun, isRunning, monthlyRunCount }: Props) {
  const navigate = useNavigate();
  const { planState } = useTier();
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
    });
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

          {runValidation && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label>Validation iterations</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {validationIterations.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[validationIterations]}
                onValueChange={([v]) => setValidationIterations(v)}
                min={VALIDATION_ITERATIONS_MIN}
                max={VALIDATION_ITERATIONS_MAX}
                step={100}
                disabled={isStarter}
              />
              <p className="text-xs text-muted-foreground">
                Higher is more thorough but slower ({VALIDATION_ITERATIONS_MIN.toLocaleString()}–
                {VALIDATION_ITERATIONS_MAX.toLocaleString()}).
              </p>
            </div>
          )}
        </div>

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
