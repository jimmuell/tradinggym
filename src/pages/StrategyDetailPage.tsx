import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, ReactNode } from 'react';
import {
  ArrowLeft, Lock, Save, Trash2, Info, RotateCcw,
  FileText, Clock, Activity, ArrowRightCircle, Shield,
  TrendingUp, Hash, Filter, ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { cn } from '@/lib/utils';

// ---------- Constants & defaults ----------

const INSTRUMENTS = ['MES', 'ES', 'NQ', 'MNQ', 'YM', 'MYM'];
const TIMEFRAMES = ['1m', '2m', '5m', '15m', '30m', '1h'];
const DIRECTIONS = ['Long', 'Short', 'Both'];
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
];

type IndicatorKey = 'ema_9' | 'ema_21' | 'ema_50' | 'ema_200' | 'vwap' | 'rsi' | 'macd' | 'bb' | 'atr';

interface IndicatorMeta {
  key: IndicatorKey;
  label: string;
  proOnly: boolean;
  defaults: Record<string, number>;
  group: 'Trend' | 'Momentum' | 'Volatility';
}

const INDICATORS: IndicatorMeta[] = [
  { key: 'ema_9', label: 'EMA-9', proOnly: false, defaults: { period: 9 }, group: 'Trend' },
  { key: 'ema_21', label: 'EMA-21', proOnly: false, defaults: { period: 21 }, group: 'Trend' },
  { key: 'ema_50', label: 'EMA-50', proOnly: false, defaults: { period: 50 }, group: 'Trend' },
  { key: 'ema_200', label: 'EMA-200', proOnly: false, defaults: { period: 200 }, group: 'Trend' },
  { key: 'vwap', label: 'VWAP', proOnly: false, defaults: {}, group: 'Trend' },
  { key: 'rsi', label: 'RSI', proOnly: true, defaults: { period: 14, overbought: 70, oversold: 30 }, group: 'Momentum' },
  { key: 'macd', label: 'MACD', proOnly: true, defaults: { fast: 12, slow: 26, signal: 9 }, group: 'Momentum' },
  { key: 'bb', label: 'Bollinger Bands', proOnly: true, defaults: { period: 20, deviation: 2 }, group: 'Volatility' },
  { key: 'atr', label: 'ATR', proOnly: true, defaults: { period: 14 }, group: 'Volatility' },
];

const INDICATOR_GROUPS: Array<'Trend' | 'Momentum' | 'Volatility'> = ['Trend', 'Momentum', 'Volatility'];

const NYSE_HOLIDAYS = [
  "New Year's Day", "Martin Luther King Jr. Day", "Presidents' Day",
  'Good Friday', 'Memorial Day', 'Independence Day',
  'Labor Day', 'Thanksgiving Day', 'Christmas Day',
];

interface FormState {
  // identity
  name: string;
  description: string;
  direction_bias: string;
  instrument: string;
  timeframe: string;
  // time
  range_start_time: string;
  range_end_time: string;
  trade_start_time: string;
  trade_end_time: string;
  eod_flat_time: string;
  timezone: string;
  skip_holidays: boolean;
  // indicators
  indicator_set: Record<string, Record<string, number | boolean>>;
  // entry
  entry_method: string;
  retest_entry_type: string;
  limit_order_placement: number | '';
  retest_stop_method: string;
  range_stop_loss_pct: number | '';
  breakout_threshold: number | '';
  use_breakout_candle_sl: boolean;
  // risk
  risk_per_trade: number | '';
  stop_loss_ticks: number | '';
  take_profit_r: number | '';
  breakeven_r: number | '';
  max_contracts: number | '';
  // trailing
  trailing_stop_enabled: boolean;
  trailing_activate_r: number | '';
  atr_length: number | '';
  atr_multiplier: number | '';
  atr_timeframe: string;
  // freq
  max_long_per_day: number | '';
  max_short_per_day: number | '';
  max_wins_per_day: number | '';
  max_losses_per_day: number | '';
  // filters
  filters: Record<string, boolean>;
}

const DEFAULTS: FormState = {
  name: '',
  description: '',
  direction_bias: 'Both',
  instrument: 'MES',
  timeframe: '5m',
  range_start_time: '08:00:00',
  range_end_time: '08:15:00',
  trade_start_time: '09:30',
  trade_end_time: '15:30',
  eod_flat_time: '16:00',
  timezone: 'America/New_York',
  skip_holidays: true,
  indicator_set: {},
  entry_method: 'on_cross',
  retest_entry_type: 'limit_order',
  limit_order_placement: 50,
  retest_stop_method: 'pct_of_range',
  range_stop_loss_pct: 100,
  breakout_threshold: 0,
  use_breakout_candle_sl: false,
  risk_per_trade: 100,
  stop_loss_ticks: 8,
  take_profit_r: 2,
  breakeven_r: 1,
  max_contracts: 1,
  trailing_stop_enabled: false,
  trailing_activate_r: 1,
  atr_length: 14,
  atr_multiplier: 1,
  atr_timeframe: 'chart',
  max_long_per_day: '',
  max_short_per_day: '',
  max_wins_per_day: '',
  max_losses_per_day: '',
  filters: {
    session_high_low: false,
    orb_wick_rejection: false,
    session_wick_rejection: false,
    volume_confirmation: false,
    gap_direction: false,
  },
};

// ---------- Small helpers ----------

function FieldLabel({
  children,
  tooltip,
  htmlFor,
}: { children: ReactNode; tooltip?: string; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm">
      <span>{children}</span>
      {tooltip && (
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Info">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </Label>
  );
}

function LockedOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-background/70 backdrop-blur-sm border border-border">
      <Lock className="h-5 w-5 mb-2 text-primary" />
      <p className="text-sm font-medium text-center px-4">{message}</p>
      <Badge variant="secondary" className="mt-2">Pro</Badge>
    </div>
  );
}

function SectionHeader({
  title, configured, total, locked, icon: Icon,
}: { title: string; configured: number; total: number; locked?: boolean; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-3 pr-2">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-left">{title}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {configured} of {total} configured
        </span>
      </div>
      {locked && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> <Badge variant="secondary">Pro</Badge>
        </span>
      )}
    </div>
  );
}

// ---------- HMS / HM time picker ----------

function pad(n: number) { return n.toString().padStart(2, '0'); }

function parseTime(value: string, withSeconds: boolean): { h: number; m: number; s: number } {
  const parts = (value || '').split(':');
  const h = Number(parts[0] ?? 0) || 0;
  const m = Number(parts[1] ?? 0) || 0;
  const s = withSeconds ? (Number(parts[2] ?? 0) || 0) : 0;
  return { h, m, s };
}

function TimePicker({
  value, onChange, withSeconds = false, disabled,
}: { value: string; onChange: (v: string) => void; withSeconds?: boolean; disabled?: boolean }) {
  const { h, m, s } = parseTime(value, withSeconds);
  const set = (next: { h?: number; m?: number; s?: number }) => {
    const nh = Math.min(23, Math.max(0, next.h ?? h));
    const nm = Math.min(59, Math.max(0, next.m ?? m));
    const ns = Math.min(59, Math.max(0, next.s ?? s));
    onChange(withSeconds ? `${pad(nh)}:${pad(nm)}:${pad(ns)}` : `${pad(nh)}:${pad(nm)}`);
  };
  const cell = (label: string, val: number, max: number, key: 'h' | 'm' | 's') => (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</span>
      <Input
        type="number"
        min={0}
        max={max}
        value={pad(val)}
        onChange={(e) => set({ [key]: Number(e.target.value) })}
        disabled={disabled}
        className="w-14 text-center px-1 tabular-nums"
      />
    </div>
  );
  return (
    <div className="flex items-end gap-1.5">
      {cell('H', h, 23, 'h')}
      <span className="pb-2 text-muted-foreground">:</span>
      {cell('M', m, 59, 'm')}
      {withSeconds && (
        <>
          <span className="pb-2 text-muted-foreground">:</span>
          {cell('S', s, 59, 's')}
        </>
      )}
    </div>
  );
}

function TimezoneClock({ tz }: { tz: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  let display = '';
  try {
    display = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit',
      hour12: true, timeZoneName: 'short',
    }).format(now);
  } catch {
    display = '—';
  }
  return (
    <p className="text-xs text-muted-foreground mt-1">
      Current time in {tz}: <span className="font-medium text-foreground">{display}</span>
    </p>
  );
}

function HolidayList() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <CollapsibleTrigger className="text-xs text-primary hover:underline flex items-center gap-1">
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
        {open ? 'Hide holidays' : 'View holidays'}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Skips NYSE/CME observed holidays including {NYSE_HOLIDAYS.join(', ')}.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------- Page ----------

export default function StrategyDetailPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planState } = useTier();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isStarter = planState === 'starter';

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<string[]>(['identity']);
  const nameRef = useRef<HTMLInputElement>(null);

  const { data: strategy, isLoading } = useQuery({
    queryKey: ['strategy', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, unknown> | null;
    },
    enabled: !isNew && !!id,
  });

  // Hydrate form from db row
  useEffect(() => {
    if (!strategy) return;
    const s = strategy as Record<string, unknown>;
    const merged: FormState = { ...DEFAULTS };
    (Object.keys(DEFAULTS) as (keyof FormState)[]).forEach((k) => {
      const v = s[k as string];
      if (v !== null && v !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (merged as any)[k] = v;
      }
    });
    if (!merged.indicator_set || typeof merged.indicator_set !== 'object') merged.indicator_set = {};
    if (!merged.filters || typeof merged.filters !== 'object') merged.filters = DEFAULTS.filters;
    setForm(merged);

    // Auto-expand sections with non-default values (always include identity)
    const open = new Set<string>(['identity']);
    if (
      merged.range_start_time !== DEFAULTS.range_start_time ||
      merged.range_end_time !== DEFAULTS.range_end_time ||
      merged.trade_start_time !== DEFAULTS.trade_start_time ||
      merged.trade_end_time !== DEFAULTS.trade_end_time ||
      merged.eod_flat_time !== DEFAULTS.eod_flat_time ||
      merged.timezone !== DEFAULTS.timezone ||
      merged.skip_holidays !== DEFAULTS.skip_holidays
    ) open.add('time');
    if (Object.keys(merged.indicator_set).length > 0) open.add('indicators');
    if (merged.entry_method !== DEFAULTS.entry_method) open.add('entry');
    if (
      merged.risk_per_trade !== DEFAULTS.risk_per_trade ||
      merged.stop_loss_ticks !== DEFAULTS.stop_loss_ticks ||
      merged.take_profit_r !== DEFAULTS.take_profit_r ||
      merged.breakeven_r !== DEFAULTS.breakeven_r ||
      merged.max_contracts !== DEFAULTS.max_contracts
    ) open.add('risk');
    if (merged.trailing_stop_enabled) open.add('trailing');
    if (
      merged.max_long_per_day !== '' || merged.max_short_per_day !== '' ||
      merged.max_wins_per_day !== '' || merged.max_losses_per_day !== ''
    ) open.add('frequency');
    if (Object.values(merged.filters).some(Boolean)) open.add('filters');
    setOpenSections(Array.from(open));
  }, [strategy]);

  const isSystem = (strategy as { is_system?: boolean } | null)?.is_system === true;
  const isOwner = !isNew && (strategy as { user_id?: string } | null)?.user_id === user?.id;
  const readOnly = isSystem;

  // ---------- Mutations ----------

  const buildPayload = () => {
    const num = (v: number | '') => (v === '' ? null : v);
    return {
      name: form.name.trim(),
      description: form.description || null,
      direction_bias: form.direction_bias,
      instrument: form.instrument,
      timeframe: form.timeframe,
      range_start_time: form.range_start_time || null,
      range_end_time: form.range_end_time || null,
      trade_start_time: form.trade_start_time || null,
      trade_end_time: form.trade_end_time || null,
      eod_flat_time: form.eod_flat_time || null,
      timezone: form.timezone,
      skip_holidays: form.skip_holidays,
      indicator_set: form.indicator_set,
      entry_method: form.entry_method,
      retest_entry_type: form.entry_method === 'on_retest' ? form.retest_entry_type : null,
      limit_order_placement: form.entry_method === 'on_retest' ? num(form.limit_order_placement) : null,
      retest_stop_method: form.entry_method === 'on_retest' ? form.retest_stop_method : null,
      range_stop_loss_pct: form.entry_method === 'on_retest' ? num(form.range_stop_loss_pct) : null,
      breakout_threshold: form.entry_method === 'on_retest' ? num(form.breakout_threshold) : null,
      use_breakout_candle_sl: form.entry_method === 'on_close' ? form.use_breakout_candle_sl : false,
      risk_per_trade: num(form.risk_per_trade),
      stop_loss_ticks: num(form.stop_loss_ticks),
      take_profit_r: num(form.take_profit_r),
      breakeven_r: num(form.breakeven_r),
      max_contracts: num(form.max_contracts),
      trailing_stop_enabled: form.trailing_stop_enabled,
      trailing_activate_r: form.trailing_stop_enabled ? num(form.trailing_activate_r) : null,
      atr_length: form.trailing_stop_enabled ? num(form.atr_length) : null,
      atr_multiplier: form.trailing_stop_enabled ? num(form.atr_multiplier) : null,
      atr_timeframe: form.trailing_stop_enabled ? form.atr_timeframe : null,
      max_long_per_day: num(form.max_long_per_day),
      max_short_per_day: num(form.max_short_per_day),
      max_wins_per_day: num(form.max_wins_per_day),
      max_losses_per_day: num(form.max_losses_per_day),
      filters: form.filters,
    };
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (isNew) {
        const insertPayload = {
          ...payload,
          user_id: user!.id,
          is_system: false,
          tier_required: 'foundation',
        };
        const { data, error } = await supabase
          .from('strategies')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(insertPayload as any)
          .select('id')
          .single();
        if (error) throw error;
        return (data as { id: string }).id;
      } else {
        const { error } = await supabase
          .from('strategies')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update(payload as any)
          .eq('id', id!);
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      queryClient.invalidateQueries({ queryKey: ['strategy'] });
      toast({ title: 'Strategy saved' });
      if (isNew && newId) navigate(`/strategies/${newId}`, { replace: true });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('strategies').delete().eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      toast({ title: 'Strategy deleted' });
      navigate('/strategies');
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Strategy name is required';
    if (!form.direction_bias) errs.direction_bias = 'Required';
    if (!form.instrument) errs.instrument = 'Required';
    if (!form.timeframe) errs.timeframe = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setOpenSections((prev) => (prev.includes('identity') ? prev : [...prev, 'identity']));
      setTimeout(() => nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    saveMutation.mutate();
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULTS, name: form.name, description: form.description });
    toast({ title: 'Reset to defaults' });
  };

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field as string]) setErrors((e) => ({ ...e, [field as string]: '' }));
  };

  const toggleIndicator = (meta: IndicatorMeta, enabled: boolean) => {
    setForm((p) => {
      const next = { ...p.indicator_set };
      if (enabled) {
        next[meta.key] = { enabled: true, ...meta.defaults };
      } else {
        delete next[meta.key];
      }
      return { ...p, indicator_set: next };
    });
  };

  const updateIndicatorSetting = (key: string, setting: string, value: number) => {
    setForm((p) => ({
      ...p,
      indicator_set: {
        ...p.indicator_set,
        [key]: { ...p.indicator_set[key], [setting]: value },
      },
    }));
  };

  const numInput = (
    field: keyof FormState,
    placeholder?: string,
  ) => (
    <Input
      type="number"
      value={form[field] as number | ''}
      onChange={(e) =>
        update(field, (e.target.value === '' ? '' : Number(e.target.value)) as FormState[typeof field])
      }
      readOnly={readOnly}
      placeholder={placeholder}
    />
  );

  // ---------- Loading / Not found ----------
  if (!isNew && isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  if (!isNew && !strategy) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Strategy not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/strategies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Strategies
        </Button>
      </div>
    );
  }

  // ---------- Section components ----------

  const lockedSection = (msg: string) => (
    <div className="relative min-h-[140px]">
      <div className="opacity-30 pointer-events-none p-4 space-y-3">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
      <LockedOverlay message={msg} />
    </div>
  );

  // Counts: total fields per section + how many the user has changed from defaults
  const diff = <K extends keyof FormState>(k: K) =>
    JSON.stringify(form[k]) !== JSON.stringify(DEFAULTS[k]) ? 1 : 0;
  const sections = {
    identity: {
      total: 5,
      configured: (form.name.trim() ? 1 : 0) + (form.description ? 1 : 0)
        + diff('direction_bias') + diff('instrument') + diff('timeframe'),
    },
    time: {
      total: 7,
      configured: diff('range_start_time') + diff('range_end_time')
        + diff('trade_start_time') + diff('trade_end_time') + diff('eod_flat_time')
        + diff('timezone') + diff('skip_holidays'),
    },
    indicators: {
      total: INDICATORS.length,
      configured: Object.keys(form.indicator_set).length,
    },
    entry: {
      total: 1,
      configured: diff('entry_method'),
    },
    risk: {
      total: 5,
      configured: diff('risk_per_trade') + diff('stop_loss_ticks') + diff('take_profit_r')
        + diff('breakeven_r') + diff('max_contracts'),
    },
    trailing: {
      total: 1,
      configured: form.trailing_stop_enabled ? 1 : 0,
    },
    frequency: {
      total: 4,
      configured: (form.max_long_per_day !== '' ? 1 : 0) + (form.max_short_per_day !== '' ? 1 : 0)
        + (form.max_wins_per_day !== '' ? 1 : 0) + (form.max_losses_per_day !== '' ? 1 : 0),
    },
    filters: {
      total: 5,
      configured: Object.values(form.filters).filter(Boolean).length,
    },
  };

  return (
    <TooltipProvider>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/strategies')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            )}
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this strategy?</AlertDialogTitle>
                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {isSystem && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 text-sm text-primary">
              This is a TradingGYM strategy. Create your own to customise the rules.
            </CardContent>
          </Card>
        )}

        {/* Accordion */}
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={(v) => setOpenSections(v as string[])}
          className="space-y-3"
        >
          {/* 1 — Identity */}
          <AccordionItem value="identity" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="Strategy Identity" fieldCount={counts.identity} />
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="name" tooltip="A short name to identify this strategy.">
                  Strategy name *
                </FieldLabel>
                <Input
                  id="name"
                  ref={nameRef}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  readOnly={readOnly}
                  placeholder="e.g. ORB 5min"
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel tooltip="Optional notes about how this strategy works.">Description</FieldLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  readOnly={readOnly}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <FieldLabel tooltip="Trade direction this strategy targets.">Direction bias *</FieldLabel>
                  <Select value={form.direction_bias} onValueChange={(v) => update('direction_bias', v)} disabled={readOnly}>
                    <SelectTrigger className={cn(errors.direction_bias && 'border-destructive')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel tooltip="Primary instrument traded.">Primary instrument *</FieldLabel>
                  <Select value={form.instrument} onValueChange={(v) => update('instrument', v)} disabled={readOnly}>
                    <SelectTrigger className={cn(errors.instrument && 'border-destructive')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTRUMENTS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel tooltip="Chart timeframe for execution.">Timeframe *</FieldLabel>
                  <Select value={form.timeframe} onValueChange={(v) => update('timeframe', v)} disabled={readOnly}>
                    <SelectTrigger className={cn(errors.timeframe && 'border-destructive')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2 — Time */}
          <AccordionItem value="time" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="Time Settings" fieldCount={counts.time} locked={isStarter} />
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {isStarter ? lockedSection('Upgrade to Pro to configure time settings') : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FieldLabel tooltip="Start of the opening range window. For ORB, typically 8:00 AM ET.">Range Start</FieldLabel>
                      <Input type="time" step={1} value={form.range_start_time} onChange={(e) => update('range_start_time', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel tooltip="End of the opening range window. Common values: 8:15 (15-min ORB) or 8:30 (30-min ORB).">Range End</FieldLabel>
                      <Input type="time" step={1} value={form.range_end_time} onChange={(e) => update('range_end_time', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel tooltip="Earliest time to take trades. RTH open is 9:30 AM ET.">Trade Start</FieldLabel>
                      <Input type="time" value={form.trade_start_time} onChange={(e) => update('trade_start_time', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel tooltip="Latest time to enter new trades. Allows 30 min before RTH close.">Trade End</FieldLabel>
                      <Input type="time" value={form.trade_end_time} onChange={(e) => update('trade_end_time', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel tooltip="Close all open positions by this time. RTH close is 4:00 PM ET.">EOD Flat</FieldLabel>
                      <Input type="time" value={form.eod_flat_time} onChange={(e) => update('eod_flat_time', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel tooltip="All times are interpreted in this timezone.">Timezone</FieldLabel>
                      <Select value={form.timezone} onValueChange={(v) => update('timezone', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <FieldLabel tooltip="Skip trading on NYSE/CME holidays.">Skip US Market Holidays</FieldLabel>
                    <Switch checked={form.skip_holidays} onCheckedChange={(v) => update('skip_holidays', v)} />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 3 — Indicators */}
          <AccordionItem value="indicators" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="Indicators" fieldCount={Object.keys(form.indicator_set).length || counts.indicators} />
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3">
              {INDICATORS.map((ind) => {
                const enabled = !!form.indicator_set[ind.key];
                const locked = isStarter && ind.proOnly;
                return (
                  <div key={ind.key} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {locked ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-2 text-muted-foreground cursor-not-allowed">
                                <Lock className="h-4 w-4" />
                                <span className="text-sm">{ind.label}</span>
                                <Badge variant="secondary">Pro</Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Upgrade to Pro to use this indicator.</TooltipContent>
                          </Tooltip>
                        ) : (
                          <>
                            <Checkbox
                              id={`ind-${ind.key}`}
                              checked={enabled}
                              onCheckedChange={(v) => toggleIndicator(ind, !!v)}
                              disabled={readOnly}
                            />
                            <Label htmlFor={`ind-${ind.key}`} className="text-sm cursor-pointer">{ind.label}</Label>
                          </>
                        )}
                      </div>
                    </div>
                    {enabled && Object.keys(ind.defaults).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1">
                        {Object.keys(ind.defaults).map((setting) => (
                          <div key={setting} className="space-y-1">
                            <Label className="text-xs capitalize">{setting}</Label>
                            <Input
                              type="number"
                              value={(form.indicator_set[ind.key]?.[setting] as number) ?? ind.defaults[setting]}
                              onChange={(e) => updateIndicatorSetting(ind.key, setting, Number(e.target.value))}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>

          {/* 4 — Entry Method */}
          <AccordionItem value="entry" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="Entry Method" fieldCount={counts.entry} />
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              <div className="space-y-2">
                <FieldLabel tooltip="How the strategy enters a trade after the setup is confirmed.">Entry Method</FieldLabel>
                <Select value={form.entry_method} onValueChange={(v) => update('entry_method', v)} disabled={readOnly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_cross">On Cross</SelectItem>
                    <SelectItem value="on_close" disabled={isStarter}>
                      <span className="flex items-center gap-2">
                        On Close {isStarter && (<><Lock className="h-3 w-3" /><Badge variant="secondary">Pro</Badge></>)}
                      </span>
                    </SelectItem>
                    <SelectItem value="on_retest" disabled={isStarter}>
                      <span className="flex items-center gap-2">
                        On Retest {isStarter && (<><Lock className="h-3 w-3" /><Badge variant="secondary">Pro</Badge></>)}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.entry_method === 'on_retest' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                  <div className="space-y-2">
                    <FieldLabel tooltip="Confirmation Order waits for a confirming candle. Limit Order places an order at a specific level.">Retest Entry Type</FieldLabel>
                    <Select value={form.retest_entry_type} onValueChange={(v) => update('retest_entry_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmation_order">Confirmation Order</SelectItem>
                        <SelectItem value="limit_order">Limit Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel tooltip="Where to place the limit order as a % of the range. 50 = midline.">Limit Order Placement (%)</FieldLabel>
                    {numInput('limit_order_placement')}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel tooltip="How to calculate the stop loss for retest entries.">Retest Stop Method</FieldLabel>
                    <Select value={form.retest_stop_method} onValueChange={(v) => update('retest_stop_method', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pct_of_range">% of Range</SelectItem>
                        <SelectItem value="fixed_ticks">Fixed Ticks</SelectItem>
                        <SelectItem value="atr_based">ATR-based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel tooltip="Stop loss as a percentage of the opening range. 100 = full range.">% of Range Stop Loss</FieldLabel>
                    {numInput('range_stop_loss_pct')}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel tooltip="Minimum breakout distance (in points) before a retest entry is valid.">Breakout % Threshold</FieldLabel>
                    {numInput('breakout_threshold')}
                  </div>
                </div>
              )}

              {form.entry_method === 'on_close' && (
                <div className="flex items-center justify-between rounded-md border p-3 animate-in fade-in slide-in-from-top-1">
                  <FieldLabel tooltip="Place the stop loss at the opposite end of the breakout candle.">Use Breakout Candle as Stop Loss</FieldLabel>
                  <Switch checked={form.use_breakout_candle_sl} onCheckedChange={(v) => update('use_breakout_candle_sl', v)} />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 5 — Risk Management */}
          <AccordionItem value="risk" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="Risk Management" fieldCount={counts.risk} />
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <FieldLabel tooltip="Maximum dollar amount to risk on a single trade.">Risk Per Trade ($)</FieldLabel>
                  {isStarter ? (
                    <div className="relative">
                      <Input disabled value="100" />
                      <LockedOverlay message="Pro" />
                    </div>
                  ) : numInput('risk_per_trade')}
                </div>
                <div className="space-y-2">
                  <FieldLabel tooltip="Stop loss distance in ticks from entry.">Stop Loss (ticks)</FieldLabel>
                  {numInput('stop_loss_ticks')}
                </div>
                <div className="space-y-2">
                  <FieldLabel tooltip="Take profit as a multiple of the stop loss. 2R = 2× the risk.">Take Profit (R-Multiple)</FieldLabel>
                  {numInput('take_profit_r')}
                </div>
                <div className="space-y-2 relative">
                  <FieldLabel tooltip="Move the stop loss to breakeven when price moves this many R in your favor.">Move SL to Breakeven at (R)</FieldLabel>
                  {isStarter ? (
                    <div className="relative">
                      <Input disabled value="1" />
                      <LockedOverlay message="Pro" />
                    </div>
                  ) : numInput('breakeven_r')}
                </div>
                <div className="space-y-2 relative md:col-span-2">
                  <FieldLabel tooltip="Maximum number of contracts per trade.">Max Contracts</FieldLabel>
                  {isStarter ? (
                    <div className="relative">
                      <Input disabled value="1" />
                      <LockedOverlay message="Upgrade to Pro" />
                    </div>
                  ) : numInput('max_contracts')}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6 — Trailing Stop */}
          <AccordionItem value="trailing" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="Trailing Stop" fieldCount={counts.trailing} locked={isStarter} />
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {isStarter ? lockedSection('Upgrade to Pro to use trailing stops') : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <FieldLabel tooltip="Activate an ATR-based trailing stop once price moves in your favor.">Enable ATR Trailing Stop</FieldLabel>
                    <Switch checked={form.trailing_stop_enabled} onCheckedChange={(v) => update('trailing_stop_enabled', v)} />
                  </div>
                  {form.trailing_stop_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-2">
                        <FieldLabel tooltip="Start trailing the stop after price moves this many R from entry.">Activate Trailing at (R)</FieldLabel>
                        {numInput('trailing_activate_r')}
                      </div>
                      <div className="space-y-2">
                        <FieldLabel tooltip="Number of bars for the ATR calculation.">ATR Length</FieldLabel>
                        {numInput('atr_length')}
                      </div>
                      <div className="space-y-2">
                        <FieldLabel tooltip="Multiply the ATR value by this factor for the trailing distance.">ATR Multiplier</FieldLabel>
                        {numInput('atr_multiplier')}
                      </div>
                      <div className="space-y-2">
                        <FieldLabel tooltip="Timeframe used for the ATR calculation.">ATR Timeframe</FieldLabel>
                        <Select value={form.atr_timeframe} onValueChange={(v) => update('atr_timeframe', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chart">Chart</SelectItem>
                            <SelectItem value="1m">1m</SelectItem>
                            <SelectItem value="5m">5m</SelectItem>
                            <SelectItem value="15m">15m</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 7 — Frequency limits */}
          <AccordionItem value="frequency" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="Trade Frequency Limits" fieldCount={counts.frequency} locked={isStarter} />
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {isStarter ? lockedSection('Upgrade to Pro to set frequency limits') : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FieldLabel tooltip="Maximum number of long entries per day. Leave empty for unlimited.">Max Long Trades Per Day</FieldLabel>
                    {numInput('max_long_per_day', 'Unlimited')}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel tooltip="Maximum number of short entries per day. Leave empty for unlimited.">Max Short Trades Per Day</FieldLabel>
                    {numInput('max_short_per_day', 'Unlimited')}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel tooltip="Stop trading after this many winning trades. Prevents overtrading on hot streaks.">Max Winning Trades Per Day</FieldLabel>
                    {numInput('max_wins_per_day', 'Unlimited')}
                  </div>
                  <div className="space-y-2">
                    <FieldLabel tooltip="Stop trading after this many losing trades. Protects against tilt.">Max Losing Trades Per Day</FieldLabel>
                    {numInput('max_losses_per_day', 'Unlimited')}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 8 — Filters */}
          <AccordionItem value="filters" className="border rounded-lg px-4">
            <AccordionTrigger>
              <SectionHeader title="High Probability Filters" fieldCount={counts.filters} locked={isStarter} />
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {isStarter ? lockedSection('Upgrade to Pro to use filters') : (
                <div className="space-y-3">
                  {[
                    { key: 'session_high_low', label: 'Session High/Low Filter', tip: 'Only take trades when price has not already broken the session high or low.' },
                    { key: 'orb_wick_rejection', label: 'ORB Wick Rejection Filter', tip: 'Skip setups where the breakout candle has a large wick rejection.' },
                    { key: 'session_wick_rejection', label: 'Session Wick Rejection Filter', tip: 'Skip setups where a session-level wick rejection occurred.' },
                    { key: 'volume_confirmation', label: 'Volume Confirmation Filter', tip: 'Require above-average volume on the breakout candle.' },
                    { key: 'gap_direction', label: 'Gap Direction Filter', tip: 'Only take trades aligned with the overnight gap direction.' },
                  ].map((f) => (
                    <div key={f.key} className="flex items-center justify-between rounded-md border p-3">
                      <FieldLabel tooltip={f.tip}>{f.label}</FieldLabel>
                      <Switch
                        checked={!!form.filters[f.key]}
                        onCheckedChange={(v) => update('filters', { ...form.filters, [f.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer actions */}
        {!readOnly && (
          <div className="flex items-center justify-between pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all fields to defaults?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetDefaults}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving…' : 'Save Strategy'}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
