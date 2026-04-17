import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AnalyticsFilter = 'today' | 'week' | 'month' | 'all-time';

export interface TradeRow {
  id: string;
  result: string | null;
  pnl: number | null;
  pnl_ticks: number | null;
  direction: string | null;
  steps_completed: number[] | null;
  opened_at: string | null;
  closed_at: string | null;
}

export interface EquityPoint {
  date: string;
  equity: number;
}

export interface DailyPnlPoint {
  date: string;
  pnl: number;
}

const BLUEPRINT_STEPS = 6;

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isInFilter(openedAt: string, filter: AnalyticsFilter): boolean {
  if (filter === 'all-time') return true;
  const d = new Date(openedAt);
  const now = new Date();
  if (filter === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (filter === 'week') {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  }
  if (filter === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  return true;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useAnalytics(filter: AnalyticsFilter) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', user?.id, filter],
    enabled: !!user?.id,
    queryFn: async (): Promise<TradeRow[]> => {
      const { data, error } = await supabase
        .from('trades')
        .select('id, result, pnl, pnl_ticks, direction, steps_completed, opened_at, closed_at')
        .eq('user_id', user!.id)
        .eq('session_type', 'simulator')
        .order('opened_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TradeRow[];
    },
  });

  const allTrades = data ?? [];
  const trades = allTrades.filter((t) => t.opened_at && isInFilter(t.opened_at, filter));

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalPnl = 0;
  let grossWins = 0;
  let grossLosses = 0;
  let bestTrade = 0;
  let worstTrade = 0;
  const winnerPnls: number[] = [];
  const loserPnls: number[] = [];
  let stepAccuracySum = 0;

  trades.forEach((t, i) => {
    const pnl = t.pnl ?? 0;
    totalPnl += pnl;
    if (i === 0) {
      bestTrade = pnl;
      worstTrade = pnl;
    } else {
      if (pnl > bestTrade) bestTrade = pnl;
      if (pnl < worstTrade) worstTrade = pnl;
    }
    if (t.result === 'win') {
      wins++;
      grossWins += pnl;
      winnerPnls.push(pnl);
    } else if (t.result === 'loss') {
      losses++;
      grossLosses += pnl;
      loserPnls.push(pnl);
    } else {
      breakevens++;
    }
    const steps = t.steps_completed?.length ?? 0;
    stepAccuracySum += (steps / BLUEPRINT_STEPS) * 100;
  });

  const totalTrades = trades.length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const avgWinner = winnerPnls.length > 0 ? grossWins / winnerPnls.length : 0;
  const avgLoser = loserPnls.length > 0 ? grossLosses / loserPnls.length : 0;
  const profitFactor = grossLosses < 0 ? grossWins / Math.abs(grossLosses) : 0;
  const avgStepAccuracy = totalTrades > 0 ? stepAccuracySum / totalTrades : 0;

  let cumulative = 0;
  const equityCurve: EquityPoint[] = trades.map((t) => {
    cumulative += t.pnl ?? 0;
    return { date: t.opened_at ? dateKey(t.opened_at) : '', equity: cumulative };
  });

  const dailyMap = new Map<string, number>();
  trades.forEach((t) => {
    if (!t.opened_at) return;
    const key = dateKey(t.opened_at);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + (t.pnl ?? 0));
  });
  const dailyPnl: DailyPnlPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl }));

  return {
    isLoading,
    trades,
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate,
    totalPnl,
    avgWinner,
    avgLoser,
    bestTrade: totalTrades > 0 ? bestTrade : 0,
    worstTrade: totalTrades > 0 ? worstTrade : 0,
    profitFactor,
    avgStepAccuracy,
    equityCurve,
    dailyPnl,
  };
}
