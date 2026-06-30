import { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  Lock,
  Loader2,
  Play,
  Sparkles,
  Target,
  Wallet,
  ShieldCheck,
  Activity,
  ChevronDown,
  Settings2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStrategies, type Strategy } from '@/hooks/useStrategies';
import { useTier, type PlanState } from '@/contexts/TierContext';
import { useBacktestRuns } from '@/hooks/useBacktestRuns';
import { pointsToDollars, ticksToDollars, formatUSD, MES_POINT_VALUE } from '@/lib/mesContract';
import { cn } from '@/lib/utils';

export type StopUnit = 'percent' | 'points';

export interface BacktestConfig {
  strategy: Strategy | null;
  startDate: string;
  endDate: string;
  initialBalance: number;
  commissionPerRt: number;
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
  { value: 500, label: '500', hint: '≈2.8s' },
  { value: 2000, label: '2,000', hint: '≈3.2s' },
  { value: 10000, label: '10,000', hint: '≈6.1s' },
] as const;
const VALIDATION_ITERATIONS_DEFAULT = 2000;
const PRO_MONTHLY_LIMIT = 5;

// ---------- Tier registry ----------
const TIER_RANK: Record<PlanState, number> = {
  starter: 0,
  pro: 1,
  expert: 2,
  guru: 3,
  admin: 4,
};
const TIER_LABEL: Record<PlanState, string> = {
  starter: 'Starter',
  pro: 'Pro',
  expert: 'Expert',
  guru: 'Guru',
  admin: 'Admin',
};

type FieldId =
  | 'strategy'
  | 'dateRange'
  | 'direction'
  | 'stop'
  | 'target'
  | 'qty'
  | 'initialBalance'
  | 'commission'
  | 'slippage'
  | 'stopUnit'
  | 'validation'
  | 'iterations'
  | 'forceRegen';

type FieldGroup = 'essentials' | 'risk' | 'account' | 'validation' | 'admin';

interface FieldDef {
  id: FieldId;
  group: FieldGroup;
  minTier: PlanState;
  label: string;
}

const FIELDS: FieldDef[] = [
  { id: 'strategy',       group: 'essentials', minTier: 'pro',    label: 'Strategy' },
  { id: 'dateRange',      group: 'essentials', minTier: 'pro',    label: 'Date range' },
  { id: 'direction',      group: 'essentials', minTier: 'pro',    label: 'Direction' },
  { id: 'stop',           group: 'risk',       minTier: 'pro',    label: 'Stop loss' },
  { id: 'target',         group: 'risk',       minTier: 'pro',    label: 'Take profit' },
  { id: 'qty',            group: 'risk',       minTier: 'pro',    label: 'Position size' },
  { id: 'initialBalance', group: 'account',    minTier: 'pro',    label: 'Initial balance' },
  { id: 'commission',     group: 'account',    minTier: 'pro',    label: 'Commission' },
  { id: 'slippage',       group: 'risk',       minTier: 'expert', label: 'Slippage modeling' },
  { id: 'stopUnit',       group: 'risk',       minTier: 'expert', label: 'Points / Percent stops' },
  { id: 'validation',     group: 'validation', minTier: 'expert', label: 'Statistical validation' },
  { id: 'iterations',     group: 'validation', minTier: 'guru',   label: 'Validation iterations' },
  { id: 'forceRegen',     group: 'admin',      minTier: 'admin',  label: 'Force-regenerate signal' },
];

type Visibility = 'visible' | 'upsell' | 'hidden';

function visibilityFor(field: FieldDef, tier: PlanState): Visibility {
  const userRank = TIER_RANK[tier];
  const fieldRank = TIER_RANK[field.minTier];
  if (fieldRank <= userRank) return 'visible';
  if (fieldRank === userRank + 1) return 'upsell';
  return 'hidden';
}

interface Props {
  onRun: (config: BacktestConfig) => void;
  isRunning: boolean;
  monthlyRunCount: number;
}

export default function BacktestConfigPanel({ onRun, isRunning, monthlyRunCount }: Props) {
  const navigate = useNavigate();
  const { planState, isAdmin } = useTier();
  const { strategies, isLoading } = useStrategies();
  const { runs } = useBacktestRuns();
  const lastRun = runs[0] ?? null;

  // Admin role overrides plan for visibility purposes.
  const effectiveTier: PlanState = isAdmin ? 'admin' : planState;

  const isStarter = effectiveTier === 'starter';
  const isPro = effectiveTier === 'pro';
  const isCockpit = effectiveTier === 'guru' || effectiveTier === 'admin';
  const isUnlimited = effectiveTier === 'expert' || effectiveTier === 'guru' || effectiveTier === 'admin';
  const remaining = isPro ? Math.max(0, PRO_MONTHLY_LIMIT - monthlyRunCount) : null;
  const outOfCredits = isPro && remaining === 0;

  // ---- State (kept in one place so values persist across tier-driven re-renders) ----
  const [strategyId, setStrategyId] = useState<string>('');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [initialBalance, setInitialBalance] = useState(10000);
  const [commissionPerRt, setCommissionPerRt] = useState(1.24); // ADR-030: flat $/round-trip
  const [direction, setDirection] = useState<'long_short' | 'long_only'>('long_short');
  // Validation OFF by default per spec (was true).
  const [runValidation, setRunValidation] = useState(false);
  const [validationIterations, setValidationIterations] = useState(VALIDATION_ITERATIONS_DEFAULT);
  const [stopLossPct, setStopLossPct] = useState(0);
  const [takeProfitPct, setTakeProfitPct] = useState(0);
  const [stopUnit, setStopUnit] = useState<StopUnit>('points');
  const [stopLossPoints, setStopLossPoints] = useState(0);
  const [takeProfitPoints, setTakeProfitPoints] = useState(0);
  const [slippageTicks, setSlippageTicks] = useState(0);
  const [qtyValue, setQtyValue] = useState(1);
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const sliderIndex = Math.max(0, ITERATION_STOPS.findIndex((s) => s.value === validationIterations));

  const canReuse = !!lastRun;

  const handleReuseLastRun = () => {
    if (!lastRun) return;
    const isVisible = (id: FieldId) => visibilityFor(FIELDS.find((f) => f.id === id)!, effectiveTier) === 'visible';

    // Strategy — hydrate only if it still exists
    if (isVisible('strategy')) {
      const stillExists = lastRun.strategy_id && strategies.some((s) => s.id === lastRun.strategy_id);
      setStrategyId(stillExists ? (lastRun.strategy_id as string) : '');
    } else {
      setStrategyId('');
    }

    if (isVisible('dateRange')) {
      setStartDate(lastRun.start_date);
      setEndDate(lastRun.end_date);
    } else {
      setStartDate('2020-01-01');
      setEndDate('2025-12-31');
    }

    if (isVisible('direction')) {
      setDirection((lastRun.direction as 'long_short' | 'long_only') || 'long_short');
    } else {
      setDirection('long_short');
    }

    if (isVisible('initialBalance')) setInitialBalance(lastRun.initial_balance ?? 10000);
    else setInitialBalance(10000);

    if (isVisible('commission')) setCommissionPct(lastRun.commission_pct ?? 0);
    else setCommissionPct(0);

    if (isVisible('qty')) setQtyValue(lastRun.qty_value ?? 1);
    else setQtyValue(1);

    // Stop unit: decide based on which value the last run stored
    const lastIsPoints = (lastRun.stop_loss_points ?? 0) > 0 || (lastRun.take_profit_points ?? 0) > 0
      || ((lastRun.stop_loss_pct ?? 0) === 0 && (lastRun.take_profit_pct ?? 0) === 0);
    const nextUnit: StopUnit = isVisible('stopUnit') ? (lastIsPoints ? 'points' : 'percent') : 'points';
    setStopUnit(nextUnit);

    if (isVisible('stop')) {
      if (nextUnit === 'points') {
        setStopLossPoints(lastRun.stop_loss_points ?? 0);
        setStopLossPct(0);
      } else {
        setStopLossPct(lastRun.stop_loss_pct ?? 0);
        setStopLossPoints(0);
      }
    } else {
      setStopLossPoints(0);
      setStopLossPct(0);
    }

    if (isVisible('target')) {
      if (nextUnit === 'points') {
        setTakeProfitPoints(lastRun.take_profit_points ?? 0);
        setTakeProfitPct(0);
      } else {
        setTakeProfitPct(lastRun.take_profit_pct ?? 0);
        setTakeProfitPoints(0);
      }
    } else {
      setTakeProfitPoints(0);
      setTakeProfitPct(0);
    }

    if (isVisible('slippage')) setSlippageTicks(lastRun.slippage_ticks ?? 0);
    else setSlippageTicks(0);

    if (isVisible('validation')) {
      const had = !!lastRun.validation || !!lastRun.validation_error;
      setRunValidation(had);
    } else {
      setRunValidation(false);
    }

    if (isVisible('iterations')) {
      // Not persisted on the run row; keep current/default.
      setValidationIterations((prev) => prev || VALIDATION_ITERATIONS_DEFAULT);
    } else {
      setValidationIterations(VALIDATION_ITERATIONS_DEFAULT);
    }

    // forceRegenerate always resets
    setForceRegenerate(false);

    toast.success(`Reused "${lastRun.strategy_name}"`);
  };


  const applyQuickTestWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday - 7);
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
    // ALWAYS submit the full payload — hidden fields still send their defaults.
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
    if (forceRegenerate) setForceRegenerate(false);
  };

  // Cmd/Ctrl+Enter to submit on cockpit tiers
  useEffect(() => {
    if (!isCockpit) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCockpit, canSubmit, selectedStrategy, startDate, endDate, initialBalance, commissionPct, direction, runValidation, validationIterations, stopUnit, stopLossPct, takeProfitPct, stopLossPoints, takeProfitPoints, slippageTicks, qtyValue, forceRegenerate]);

  const vis = useMemo(() => {
    const map = {} as Record<FieldId, Visibility>;
    for (const f of FIELDS) map[f.id] = visibilityFor(f, effectiveTier);
    return map;
  }, [effectiveTier]);

  // ---- Live cost summary (cockpit only) ----
  const costSummary = useMemo(() => {
    const stopDollars = stopUnit === 'points'
      ? pointsToDollars(stopLossPoints, qtyValue)
      : (stopLossPct / 100) * initialBalance;
    const targetDollars = stopUnit === 'points'
      ? pointsToDollars(takeProfitPoints, qtyValue)
      : (takeProfitPct / 100) * initialBalance;
    // Rough MES notional ~ $5,000/contract (ES ~5000 × $5/pt × 0.05 stub). Use a simple
    // honest model: commissionPct% of $5,000 notional × 2 sides × qty per round-trip.
    const MES_NOTIONAL = 5000;
    const commissionPerRT = (commissionPct / 100) * MES_NOTIONAL * 2 * qtyValue;
    const commissionDrag100 = commissionPerRT * 100;
    return {
      stopDollars: Math.round(stopDollars),
      targetDollars: Math.round(targetDollars),
      commissionDrag100: Math.round(commissionDrag100),
    };
  }, [stopUnit, stopLossPoints, takeProfitPoints, stopLossPct, takeProfitPct, qtyValue, initialBalance, commissionPct]);

  // ---------- Sub-renderers (one source per field — works in both skins) ----------

  const StrategyField = (
    <div className="space-y-2">
      <Label>Strategy</Label>
      <Select value={strategyId} onValueChange={setStrategyId} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a strategy'} />
        </SelectTrigger>
        <SelectContent>
          {strategies.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
          {strategies.length === 0 && !isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No strategies yet</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  const DateRangeFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={applyQuickTestWeek} className="gap-1.5">
          <CalendarRange className="h-3.5 w-3.5" />
          Quick test (1 week)
        </Button>
      </div>
    </>
  );

  const DirectionField = (
    <div className="space-y-2">
      <Label>Direction</Label>
      <Select value={direction} onValueChange={(v: 'long_short' | 'long_only') => setDirection(v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="long_short">Long & Short</SelectItem>
          <SelectItem value="long_only">Long Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const StopUnitToggle = (
    <div className="space-y-1.5">
      <Label className="text-xs">Stop units</Label>
      <ToggleGroup
        type="single"
        value={stopUnit}
        onValueChange={(v) => v && setStopUnit(v as StopUnit)}
        className="justify-start"
      >
        <ToggleGroupItem value="points" aria-label="Points" className="px-3">Points</ToggleGroupItem>
        <ToggleGroupItem value="percent" aria-label="Percent" className="px-3">Percent</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  const StopField = ({ dense = false, disabled = false }: { dense?: boolean; disabled?: boolean } = {}) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="stop-input" className={cn('text-xs', dense && 'whitespace-nowrap')}>
          {dense ? 'Stop loss' : (stopUnit === 'points' ? 'Stop loss (points)' : 'Stop loss (% from entry)')}
        </Label>
        {dense && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {stopUnit === 'points' ? 'pts' : '%'}
          </span>
        )}
      </div>
      {stopUnit === 'points' ? (
        <Input id="stop-input" type="number" min={0} step={0.25}
          value={stopLossPoints}
          onChange={(e) => setStopLossPoints(Math.max(0, Number(e.target.value) || 0))}
          disabled={disabled}
          className="tabular-nums" />
      ) : (
        <Input id="stop-input" type="number" min={0} max={100} step={0.1}
          value={stopLossPct}
          onChange={(e) => setStopLossPct(Math.max(0, Number(e.target.value) || 0))}
          disabled={disabled}
          className="tabular-nums" />
      )}
      {dense ? (
        (stopUnit === 'points' ? stopLossPoints > 0 : stopLossPct > 0) && (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {stopUnit === 'points'
              ? `${stopLossPoints} pts = ${formatUSD(pointsToDollars(stopLossPoints, qtyValue))} risk`
              : `${stopLossPct}% = ${formatUSD((stopLossPct / 100) * initialBalance)} risk`}
          </p>
        )
      ) : (
        stopUnit === 'points' && stopLossPoints > 0 && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {stopLossPoints} pts = {formatUSD(pointsToDollars(stopLossPoints))} risk / contract
            {qtyValue > 1 && ` · × ${qtyValue} = ${formatUSD(pointsToDollars(stopLossPoints, qtyValue))}`}
          </p>
        )
      )}
    </div>
  );


  const TargetField = ({ dense = false, disabled = false }: { dense?: boolean; disabled?: boolean } = {}) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="target-input" className={cn('text-xs', dense && 'whitespace-nowrap')}>
          {dense ? 'Take profit' : (stopUnit === 'points' ? 'Take profit (points)' : 'Take profit (% from entry)')}
        </Label>
        {dense && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {stopUnit === 'points' ? 'pts' : '%'}
          </span>
        )}
      </div>
      {stopUnit === 'points' ? (
        <Input id="target-input" type="number" min={0} step={0.25}
          value={takeProfitPoints}
          onChange={(e) => setTakeProfitPoints(Math.max(0, Number(e.target.value) || 0))}
          disabled={disabled}
          className="tabular-nums" />
      ) : (
        <Input id="target-input" type="number" min={0} step={0.1}
          value={takeProfitPct}
          onChange={(e) => setTakeProfitPct(Math.max(0, Number(e.target.value) || 0))}
          disabled={disabled}
          className="tabular-nums" />
      )}
      {dense ? (
        (stopUnit === 'points' ? takeProfitPoints > 0 : takeProfitPct > 0) && (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {stopUnit === 'points'
              ? `${takeProfitPoints} pts = ${formatUSD(pointsToDollars(takeProfitPoints, qtyValue))} target`
              : `${takeProfitPct}% = ${formatUSD((takeProfitPct / 100) * initialBalance)} target`}
          </p>
        )
      ) : (
        stopUnit === 'points' && takeProfitPoints > 0 && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {takeProfitPoints} pts = {formatUSD(pointsToDollars(takeProfitPoints))} goal / contract
            {qtyValue > 1 && ` · × ${qtyValue} = ${formatUSD(pointsToDollars(takeProfitPoints, qtyValue))}`}
          </p>
        )
      )}
    </div>
  );


  const QtyField = ({ dense = false }: { dense?: boolean } = {}) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="qty-value" className={cn('text-xs', dense && 'whitespace-nowrap')}>
          {dense ? 'Position size' : 'Position size (contracts)'}
        </Label>
        {dense && <span className="text-[10px] text-muted-foreground">contracts</span>}
      </div>
      <Input id="qty-value" type="number" min={1} step={1}
        value={qtyValue}
        onChange={(e) => setQtyValue(Math.max(1, Math.trunc(Number(e.target.value) || 1)))}
        className="tabular-nums" />
    </div>
  );

  const SlippageField = ({ disabled = false, dense = false }: { disabled?: boolean; dense?: boolean } = {}) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="slippage-ticks" className={cn('text-xs', dense && 'whitespace-nowrap')}>
          {dense ? 'Slippage' : 'Slippage (ticks)'}
        </Label>
        {dense && <span className="text-[10px] text-muted-foreground">ticks</span>}
      </div>
      <Input id="slippage-ticks" type="number" min={0} step={1}
        value={slippageTicks}
        onChange={(e) => setSlippageTicks(Math.max(0, Number(e.target.value) || 0))}
        onBlur={(e) => setSlippageTicks(Math.max(0, Math.round(Number(e.target.value) || 0)))}
        disabled={disabled}
        className="tabular-nums" />
      <p className={cn('text-muted-foreground tabular-nums', dense ? 'text-[10px]' : 'text-[11px]')}>
        {slippageTicks} ticks = {formatUSD(ticksToDollars(slippageTicks))} / contract per fill
      </p>
    </div>
  );

  const InitialBalanceField = (
    <div className="space-y-2">
      <Label>Initial balance ($)</Label>
      <Input type="number" value={initialBalance}
        onChange={(e) => setInitialBalance(Number(e.target.value))}
        className="tabular-nums" />
    </div>
  );

  const CommissionField = (
    <div className="space-y-2">
      <Label>Commission %</Label>
      <Input type="number" step="0.01" value={commissionPct}
        onChange={(e) => setCommissionPct(Number(e.target.value))}
        className="tabular-nums" />
      <p className="text-[11px] text-amber-600 dark:text-amber-400">
        Percent commission heavily distorts futures results — a realistic $/round-trip model is coming. Default is 0.
      </p>
    </div>
  );

  const ValidationToggle = ({ dense = false }: { dense?: boolean } = {}) => (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <Label htmlFor="run-validation" className={cn(dense && 'whitespace-nowrap')}>Statistical validation</Label>
        <p className="text-xs text-muted-foreground">Check if your edge is real, not luck.</p>
      </div>
      {runValidation ? (
        <Switch id="run-validation" checked onCheckedChange={setRunValidation} />
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setRunValidation(true)}>
          Enable
        </Button>
      )}
    </div>
  );

  const IterationsField = (disabled = false) => (
    <div className={cn('space-y-2 pt-1', !runValidation && 'opacity-50 pointer-events-none')}>
      <Label className="text-xs">Iterations</Label>
      {isCockpit ? (
        <ToggleGroup
          type="single"
          value={String(validationIterations)}
          onValueChange={(v) => v && setValidationIterations(Number(v))}
          className="justify-start"
          disabled={disabled || !runValidation}
        >
          {ITERATION_STOPS.map((s) => (
            <ToggleGroupItem key={s.value} value={String(s.value)} className="px-3 text-xs">
              {s.label}
              <span className="ml-1 opacity-60">{s.hint}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <>
          <Slider
            min={0}
            max={ITERATION_STOPS.length - 1}
            step={1}
            value={[sliderIndex]}
            onValueChange={([i]) => setValidationIterations(ITERATION_STOPS[i].value)}
            disabled={disabled || !runValidation}
          />
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
            {ITERATION_STOPS.map((s) => (
              <span key={s.value} className={s.value === validationIterations ? 'text-foreground font-medium' : ''}>
                {s.label} <span className="opacity-70">{s.hint}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const ForceRegenField = ({ dense = false }: { dense?: boolean } = {}) => (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-dashed border-border p-3">
      <div className="space-y-0.5">
        <Label htmlFor="force-regenerate" className={cn(dense && 'whitespace-nowrap')}>Force-regenerate signal</Label>
        <p className="text-xs text-muted-foreground">
          Admin only. Ignores the cached signal and regenerates it via Claude for this run. Resets after each run.
        </p>
      </div>
      <Switch id="force-regenerate" checked={forceRegenerate} onCheckedChange={setForceRegenerate} />
    </div>
  );

  // ---------- Section primitive ----------
  const Section = ({
    icon: Icon,
    title,
    children,
    ribbon,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
    ribbon?: boolean;
  }) => (
    <div className={cn('relative space-y-3 rounded-lg border p-3', ribbon && 'pl-4')}>
      {ribbon && <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary/70" />}
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );

  // ---------- Upgrade pill (for Advanced collapsible) ----------
  const UpsellRow = ({ field }: { field: FieldDef }) => (
    <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border/70 px-3 py-2 opacity-80">
      <div className="text-sm">{field.label}</div>
      <Badge variant="secondary" className="cursor-pointer" onClick={() => navigate(`/pricing?highlight=${field.minTier}`)}>
        {TIER_LABEL[field.minTier]} unlocks
      </Badge>
    </div>
  );

  // ---------- Layouts ----------

  // Friendly (Pro / Expert): grouped single-column with Advanced reveal
  const FriendlyLayout = (
    <div className="space-y-4">
      <Section icon={Target} title="Strategy & period">
        {StrategyField}
        {DateRangeFields}
        {DirectionField}
      </Section>

      <Section icon={ShieldCheck} title="Risk & execution">
        {vis.stopUnit === 'visible' && StopUnitToggle}
        <div className="grid grid-cols-2 gap-3">
          {StopField()}
          {TargetField()}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {QtyField()}
          {vis.slippage === 'visible' && SlippageField()}
        </div>
      </Section>

      <Section icon={Wallet} title="Account">
        <div className="grid grid-cols-2 gap-3">
          {InitialBalanceField}
          {CommissionField}
        </div>
      </Section>

      {vis.validation === 'visible' && (
        <Section icon={Activity} title="Validation">
          {ValidationToggle()}
          {runValidation && vis.iterations === 'visible' && IterationsField()}
        </Section>
      )}

      {/* Advanced — upsell surface for the next tier */}
      <AdvancedReveal vis={vis} fields={FIELDS} />
    </div>
  );

  // Cockpit (Guru / Admin): responsive auto-fit grid that folds to one column when narrow
  const CockpitLayout = (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <Section icon={Target} title="Strategy & period" ribbon>
          {StrategyField}
          {DateRangeFields}
          {DirectionField}
        </Section>
        <Section icon={ShieldCheck} title="Risk & execution" ribbon>
          {StopUnitToggle}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
            {StopField({ dense: true })}
            {TargetField({ dense: true })}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
            {QtyField({ dense: true })}
            {SlippageField({ dense: true })}
          </div>
        </Section>
        <Section icon={Wallet} title="Account" ribbon>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
            {InitialBalanceField}
            {CommissionField}
          </div>
        </Section>
        <Section icon={Activity} title="Validation" ribbon>
          {ValidationToggle({ dense: true })}
          {IterationsField()}
        </Section>
        {vis.forceRegen === 'visible' && ForceRegenField({ dense: true })}
      </div>

      {/* Live cost summary */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm tabular-nums">
          <span className="text-muted-foreground">
            Risk / trade <span className="text-foreground font-semibold">{formatUSD(costSummary.stopDollars)}</span>
          </span>
          <span className="text-muted-foreground">
            Target / trade <span className="text-foreground font-semibold">{formatUSD(costSummary.targetDollars)}</span>
          </span>
          <span className="text-muted-foreground">
            Commission drag · 100 trades <span className="text-foreground font-semibold">{formatUSD(costSummary.commissionDrag100)}</span>
          </span>
        </div>
      </div>
    </div>
  );



  // ---------- Render ----------

  const RunButton = (
    <Button onClick={handleRun} disabled={!canSubmit} className="w-full" size="lg">
      {isRunning ? (
        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running backtest…</>
      ) : (
        <><Play className="h-4 w-4 mr-2" /> Run backtest{isCockpit && <span className="ml-2 text-xs opacity-70">⌘↵</span>}</>
      )}
    </Button>
  );

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Configure backtest</span>
          <div className="flex items-center gap-2">
            {!isStarter && canReuse && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs font-normal"
                onClick={handleReuseLastRun}
                title={`Reuse "${lastRun?.strategy_name}"`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reuse last run
              </Button>
            )}
            {!isStarter && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {TIER_LABEL[effectiveTier]}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isStarter && (isCockpit ? CockpitLayout : FriendlyLayout)}

        {isPro && (
          <p className="text-xs text-muted-foreground">
            {remaining} of {PRO_MONTHLY_LIMIT} monthly backtests remaining
          </p>
        )}
        {isUnlimited && (
          <p className="text-xs text-muted-foreground">Unlimited backtests on your plan</p>
        )}

        {!isStarter && (
          <div className={cn(isCockpit && 'lg:sticky lg:bottom-2 lg:bg-card lg:pt-2 lg:-mx-1 lg:px-1')}>
            {RunButton}
          </div>
        )}

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
            <h3 className="text-xl font-semibold text-foreground">Backtesting is a Pro feature</h3>
            <p className="text-sm text-muted-foreground">
              Validate your strategies against 18 years of historical MES data
            </p>
            <Button size="lg" onClick={() => navigate('/pricing?highlight=pro')} className="gap-2">
              <Sparkles className="h-4 w-4" /> Upgrade to Pro — $29/mo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );

  // satisfy unused-import safety
  void MES_POINT_VALUE;
}

// ---------- Advanced reveal (Pro/Expert only) ----------
function AdvancedReveal({ vis, fields }: { vis: Record<string, Visibility>; fields: FieldDef[] }) {
  const navigate = useNavigate();
  const upsellFields = fields.filter((f) => vis[f.id] === 'upsell');
  const [open, setOpen] = useState(false);
  if (upsellFields.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Advanced controls
            <Badge variant="secondary" className="text-[10px]">{upsellFields.length} locked</Badge>
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {upsellFields.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border/70 px-3 py-2 opacity-80">
            <div className="text-sm">{f.label}</div>
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => navigate(`/pricing?highlight=${f.minTier}`)}
            >
              {TIER_LABEL[f.minTier]} unlocks
            </Badge>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
