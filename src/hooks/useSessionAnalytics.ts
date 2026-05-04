import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SessionAnalyticsFilter = '30d' | '60d' | '90d' | 'all';

export interface SessionSummary {
  id: string;
  date: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  cost_per_trade: number;
  daily_data_fee: number;
  tick_value: number;
  max_daily_loss: number | null;
  planned_trades: number | null;
  checklist_session_id: string | null;
  // Computed from trades
  grossPnl: number;
  netPnl: number;
  feeDragPct: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
}

export interface DailyNetPnlPoint {
  date: string;
  net: number;
  gross: number;
}

export interface FeeDragPoint {
  date: string;
  feeDrag: number;
}

export interface SessionAnalytics {
  isLoading: boolean;
  sessions: SessionSummary[];
  dailyNetPnl: DailyNetPnlPoint[];
  feeDragTrend: FeeDragPoint[];
  totalSessions: number;
  avgNetPnl: number;
  avgFeeDrag: number;
  planAdherencePct: number;
  lossLimitBreaches: number;
  totalGross: number;
  totalNet: number;
  totalTrades: number;
  overallWinRate: number;
}

function filterDate(days: number | null): string | null {
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysForFilter(f: SessionAnalyticsFilter): number | null {
  if (f === '30d') return 30;
  if (f === '60d') return 60;
  if (f === '90d') return 90;
  return null;
}

interface TradeRow {
  trading_session_id: string | null;
  gross_pnl: number | null;
  commission: number | null;
  net_pnl: number | null;
  result: string | null;
}

export function useSessionAnalytics(filter: SessionAnalyticsFilter): SessionAnalytics {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['session-analytics', user?.id, filter],
    enabled: !!user?.id,
    queryFn: async () => {
      const days = daysForFilter(filter);
      const since = filterDate(days);

      let q = supabase
        .from('trading_sessions')
        .select(
          'id, date, started_at, ended_at, status, cost_per_trade, daily_data_fee, tick_value, max_daily_loss, planned_trades, checklist_session_id',
        )
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false });

      if (since) q = q.gte('started_at', since);

      const { data: sessionsData, error: sessionsErr } = await q;
      if (sessionsErr) throw sessionsErr;

      const sessions = sessionsData ?? [];
      const sessionIds = sessions.map((s) => s.id);

      let manualTrades: TradeRow[] = [];
      let liveTrades: TradeRow[] = [];

      if (sessionIds.length > 0) {
        const [{ data: t1, error: e1 }, { data: t2, error: e2 }] = await Promise.all([
          supabase
            .from('trades')
            .select('trading_session_id, gross_pnl, commission, net_pnl, result')
            .eq('user_id', user!.id)
            .in('trading_session_id', sessionIds),
          supabase
            .from('live_trades')
            .select('trading_session_id, gross_pnl, commission, net_pnl, result')
            .eq('user_id', user!.id)
            .in('trading_session_id', sessionIds),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;
        manualTrades = (t1 ?? []) as TradeRow[];
        liveTrades = (t2 ?? []) as TradeRow[];
      }

      return { sessions, manualTrades, liveTrades };
    },
  });

  const sessionsRaw = data?.sessions ?? [];
  const allTrades: TradeRow[] = [
    ...(data?.manualTrades ?? []),
    ...(data?.liveTrades ?? []),
  ].filter((t) => t.result !== null);

  const tradesBySession = new Map<string, TradeRow[]>();
  for (const t of allTrades) {
    if (!t.trading_session_id) continue;
    const arr = tradesBySession.get(t.trading_session_id) ?? [];
    arr.push(t);
    tradesBySession.set(t.trading_session_id, arr);
  }

  const sessions: SessionSummary[] = sessionsRaw.map((s) => {
    const trs = tradesBySession.get(s.id) ?? [];
    let grossPnl = 0;
    let totalNet = 0;
    let totalCommission = 0;
    let winCount = 0;
    let lossCount = 0;

    for (const t of trs) {
      grossPnl += Number(t.gross_pnl ?? 0);
      totalNet += Number(t.net_pnl ?? 0);
      totalCommission += Number(t.commission ?? 0);
      if (t.result === 'win') winCount++;
      else if (t.result === 'loss') lossCount++;
    }

    const dailyDataFee = Number(s.daily_data_fee ?? 0);
    const netPnl = totalNet - dailyDataFee;
    const totalCosts = totalCommission + dailyDataFee;
    const feeDragPct = grossPnl !== 0 ? (totalCosts / Math.abs(grossPnl)) * 100 : 0;
    const tradeCount = trs.length;
    const decisive = winCount + lossCount;
    const winRate = decisive > 0 ? (winCount / decisive) * 100 : 0;

    return {
      id: s.id,
      date: s.date,
      started_at: s.started_at,
      ended_at: s.ended_at,
      status: s.status,
      cost_per_trade: Number(s.cost_per_trade ?? 0),
      daily_data_fee: dailyDataFee,
      tick_value: Number(s.tick_value ?? 0),
      max_daily_loss: s.max_daily_loss !== null ? Number(s.max_daily_loss) : null,
      planned_trades: s.planned_trades,
      checklist_session_id: s.checklist_session_id,
      grossPnl,
      netPnl,
      feeDragPct,
      tradeCount,
      winCount,
      lossCount,
      winRate,
    };
  });

  // Aggregates
  const totalSessions = sessions.length;
  const totalGross = sessions.reduce((sum, s) => sum + s.grossPnl, 0);
  const totalNet = sessions.reduce((sum, s) => sum + s.netPnl, 0);
  const totalTrades = sessions.reduce((sum, s) => sum + s.tradeCount, 0);
  const totalWins = sessions.reduce((sum, s) => sum + s.winCount, 0);
  const totalLosses = sessions.reduce((sum, s) => sum + s.lossCount, 0);
  const overallWinRate = totalWins + totalLosses > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0;
  const avgNetPnl = totalSessions > 0 ? totalNet / totalSessions : 0;

  const sessionsWithDrag = sessions.filter((s) => s.grossPnl !== 0);
  const avgFeeDrag =
    sessionsWithDrag.length > 0
      ? sessionsWithDrag.reduce((sum, s) => sum + s.feeDragPct, 0) / sessionsWithDrag.length
      : 0;

  const sessionsWithPlan = sessions.filter((s) => s.planned_trades !== null && s.planned_trades !== undefined);
  const adherent = sessionsWithPlan.filter((s) => s.tradeCount <= (s.planned_trades ?? 0)).length;
  const planAdherencePct = sessionsWithPlan.length > 0 ? (adherent / sessionsWithPlan.length) * 100 : 0;

  const lossLimitBreaches = sessions.filter(
    (s) => s.max_daily_loss !== null && s.netPnl < 0 && Math.abs(s.netPnl) > (s.max_daily_loss ?? 0),
  ).length;

  // Charts (oldest -> newest)
  const sessionsAsc = [...sessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );
  const dailyNetPnl: DailyNetPnlPoint[] = sessionsAsc.map((s) => ({
    date: s.date,
    net: Number(s.netPnl.toFixed(2)),
    gross: Number(s.grossPnl.toFixed(2)),
  }));
  const feeDragTrend: FeeDragPoint[] = sessionsAsc.map((s) => ({
    date: s.date,
    feeDrag: Number(s.feeDragPct.toFixed(2)),
  }));

  return {
    isLoading,
    sessions,
    dailyNetPnl,
    feeDragTrend,
    totalSessions,
    avgNetPnl,
    avgFeeDrag,
    planAdherencePct,
    lossLimitBreaches,
    totalGross,
    totalNet,
    totalTrades,
    overallWinRate,
  };
}
