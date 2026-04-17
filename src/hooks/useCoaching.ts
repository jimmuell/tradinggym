import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TradeRow {
  id: string;
  result: string | null;
  pnl: number | null;
  steps_completed: number[] | null;
  opened_at: string | null;
  closed_at: string | null;
}

const BLUEPRINT_STEPS = 6;

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  const s = startOfWeek(d);
  return dateKey(s.toISOString());
}

export function useCoaching() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['coaching', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TradeRow[]> => {
      const { data, error } = await supabase
        .from('trades')
        .select('id, result, pnl, steps_completed, opened_at, closed_at')
        .eq('user_id', user!.id)
        .eq('session_type', 'simulator')
        .order('opened_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TradeRow[];
    },
  });

  const trades = (data ?? []).filter((t) => t.opened_at);
  const totalTrades = trades.length;

  // ---- This week
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekTrades = trades.filter((t) => {
    const d = new Date(t.opened_at!);
    return d >= weekStart && d < weekEnd;
  });

  const weekDays = new Set(weekTrades.map((t) => dateKey(t.opened_at!)));
  const sessionsThisWeek = weekDays.size;

  let weekWins = 0;
  let weekLosses = 0;
  weekTrades.forEach((t) => {
    if (t.result === 'win') weekWins++;
    else if (t.result === 'loss') weekLosses++;
  });
  const winRateThisWeek = weekWins + weekLosses > 0 ? (weekWins / (weekWins + weekLosses)) * 100 : 0;

  const weekDailyPnl = new Map<string, number>();
  weekTrades.forEach((t) => {
    const k = dateKey(t.opened_at!);
    weekDailyPnl.set(k, (weekDailyPnl.get(k) ?? 0) + (t.pnl ?? 0));
  });
  const worstDayPnl = Array.from(weekDailyPnl.values()).reduce((min, v) => (v < min ? v : min), 0);
  const maxDailyDrawdownThisWeek = (Math.abs(worstDayPnl) / 10000) * 100;

  // ---- Lifetime milestones
  const dailyTradeCounts = new Map<string, number>();
  trades.forEach((t) => {
    const k = dateKey(t.opened_at!);
    dailyTradeCounts.set(k, (dailyTradeCounts.get(k) ?? 0) + 1);
  });
  const hasTenTradeSession = Array.from(dailyTradeCounts.values()).some((c) => c >= 10);

  const weeklyPnl = new Map<string, number>();
  trades.forEach((t) => {
    const k = weekKey(t.opened_at!);
    weeklyPnl.set(k, (weeklyPnl.get(k) ?? 0) + (t.pnl ?? 0));
  });
  const hasPositiveWeek = Array.from(weeklyPnl.values()).some((v) => v > 0);

  // 5 consecutive calendar days with at least 1 trade
  const sortedDays = Array.from(dailyTradeCounts.keys()).sort();
  let hasConsecutiveDays = false;
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
      if (streak >= 5) {
        hasConsecutiveDays = true;
        break;
      }
    } else {
      streak = 1;
    }
  }

  // 30 consecutive trades with pnl >= -50
  let safeStreak = 0;
  let hasRiskMaster = false;
  for (const t of trades) {
    if ((t.pnl ?? 0) >= -50) {
      safeStreak++;
      if (safeStreak >= 30) {
        hasRiskMaster = true;
        break;
      }
    } else {
      safeStreak = 0;
    }
  }

  // ---- Lifetime insights
  let wins = 0;
  let losses = 0;
  let stepAccuracySum = 0;
  let winnerSum = 0;
  let loserSum = 0;
  trades.forEach((t) => {
    if (t.result === 'win') {
      wins++;
      winnerSum += t.pnl ?? 0;
    } else if (t.result === 'loss') {
      losses++;
      loserSum += t.pnl ?? 0;
    }
    stepAccuracySum += ((t.steps_completed?.length ?? 0) / BLUEPRINT_STEPS) * 100;
  });
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const avgStepAccuracy = totalTrades > 0 ? stepAccuracySum / totalTrades : 0;
  const avgWinningPnl = wins > 0 ? winnerSum / wins : 0;
  const avgLosingPnl = losses > 0 ? loserSum / losses : 0;

  // Best hour: hour with highest win rate (min 3 trades)
  const hourStats = new Map<number, { wins: number; losses: number }>();
  trades.forEach((t) => {
    if (!t.opened_at || (t.result !== 'win' && t.result !== 'loss')) return;
    const h = new Date(t.opened_at).getHours();
    const cur = hourStats.get(h) ?? { wins: 0, losses: 0 };
    if (t.result === 'win') cur.wins++;
    else cur.losses++;
    hourStats.set(h, cur);
  });
  let bestHour: number | null = null;
  let bestHourRate = -1;
  hourStats.forEach((s, h) => {
    const total = s.wins + s.losses;
    if (total < 3) return;
    const rate = s.wins / total;
    if (rate > bestHourRate) {
      bestHourRate = rate;
      bestHour = h;
    }
  });

  // Longest win streak
  let longestWinStreak = 0;
  let curStreak = 0;
  trades.forEach((t) => {
    if (t.result === 'win') {
      curStreak++;
      if (curStreak > longestWinStreak) longestWinStreak = curStreak;
    } else {
      curStreak = 0;
    }
  });

  return {
    isLoading,
    sessionsThisWeek,
    winRateThisWeek,
    journalEntriesThisWeek: 0,
    maxDailyDrawdownThisWeek,
    totalTrades,
    hasFirstTrade: totalTrades >= 1,
    hasTenTradeSession,
    hasPositiveWeek,
    hasConsecutiveDays,
    hasRiskMaster,
    winRate,
    avgStepAccuracy,
    bestHour,
    avgLosingPnl,
    avgWinningPnl,
    longestWinStreak,
  };
}
