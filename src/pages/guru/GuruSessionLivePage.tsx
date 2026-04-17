// POST-MVP ENHANCEMENT: Drawing sync
// When implemented, this will broadcast drawing tool state (lines, rectangles,
// text labels) alongside chart viewport state so students see the guru's
// annotations in real time. Deferred to Version 2.
// See: src/hooks/useSessionBroadcast.ts — extend ChartState with drawings array

import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruSessions } from '@/hooks/useGuruSessions';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';
import { useSessionBroadcast } from '@/hooks/useSessionBroadcast';
import { loadTimeframeData, type Timeframe } from '@/lib/chartData';

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const TF_OPTIONS: { label: string; value: Timeframe; broadcast: string }[] = [
  { label: '1m', value: '1m', broadcast: '1' },
  { label: '5m', value: '5m', broadcast: '5' },
  { label: '30m', value: '30m', broadcast: '30' },
  { label: '1H', value: '1h', broadcast: '60' },
  { label: '1D', value: '1D', broadcast: '1D' },
];

export default function GuruSessionLivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: guruProfile, isLoading: profileLoading } = useGuruProfile();
  const { sessions, isLoading: sessionsLoading, endSession } = useGuruSessions();
  const { cohorts } = useGuruCohorts();
  const [now, setNow] = useState(Date.now());
  const [confirmEnd, setConfirmEnd] = useState(false);

  const [symbol, setSymbol] = useState('MES1!');
  const [symbolDraft, setSymbolDraft] = useState('MES1!');
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const symbolRef = useRef(symbol);
  const tfRef = useRef(timeframe);

  const session = useMemo(() => sessions.find((s) => s.id === id) ?? null, [sessions, id]);

  const { broadcastChartState, presenceCount, presenceUsers, isConnected } = useSessionBroadcast(
    session?.id,
    'presenter',
  );

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);
  useEffect(() => {
    tfRef.current = timeframe;
  }, [timeframe]);

  // Init chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true, secondsVisible: false },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    });
    ro.observe(container);

    const rangeHandler = (range: { from: Time; to: Time } | null) => {
      if (!range) return;
      const fromTs = typeof range.from === 'number' ? range.from : Math.floor(new Date(String(range.from)).getTime() / 1000);
      const toTs = typeof range.to === 'number' ? range.to : Math.floor(new Date(String(range.to)).getTime() / 1000);
      const tfOpt = TF_OPTIONS.find((t) => t.value === tfRef.current);
      broadcastChartState({
        symbol: symbolRef.current,
        timeframe: tfOpt?.broadcast ?? '5',
        fromTimestamp: fromTs,
        toTimestamp: toTs,
      });
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(rangeHandler);

    return () => {
      ro.disconnect();
      chart.timeScale().unsubscribeVisibleTimeRangeChange(rangeHandler);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [broadcastChartState]);

  // Load data on timeframe change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadTimeframeData(timeframe);
      if (cancelled) return;
      seriesRef.current?.setData(data);
      chartRef.current?.timeScale().fitContent();
      // Broadcast immediately on symbol/timeframe change
      const range = chartRef.current?.timeScale().getVisibleRange();
      if (range) {
        const fromTs = typeof range.from === 'number' ? range.from : Math.floor(new Date(String(range.from)).getTime() / 1000);
        const toTs = typeof range.to === 'number' ? range.to : Math.floor(new Date(String(range.to)).getTime() / 1000);
        const tfOpt = TF_OPTIONS.find((t) => t.value === timeframe);
        broadcastChartState({
          symbol,
          timeframe: tfOpt?.broadcast ?? '5',
          fromTimestamp: fromTs,
          toTimestamp: toTs,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [timeframe, symbol, broadcastChartState]);

  if (profileLoading || sessionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (guruProfile?.status !== 'active') return <Navigate to="/guru" replace />;
  if (!session) return <Navigate to="/guru/sessions" replace />;
  if (session.guru_id !== guruProfile.id) return <Navigate to="/guru/sessions" replace />;
  if (session.status !== 'live') return <Navigate to="/guru/sessions" replace />;

  const cohortName = cohorts.find((c) => c.id === session.cohort_id)?.name ?? '—';
  const duration = formatDuration(now - new Date(session.scheduled_at).getTime());
  const studentCount = Math.max(0, presenceCount - 1);
  const studentUsers = presenceUsers.filter((u) => u.role === 'viewer');

  const handleEnd = async () => {
    try {
      await endSession.mutateAsync(session.id);
      toast.success('Session ended');
      navigate('/guru/sessions');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const applySymbol = () => {
    const next = symbolDraft.trim();
    if (next && next !== symbol) setSymbol(next);
    else setSymbolDraft(symbol);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold truncate">{session.title}</h1>
          <p className="text-xs text-muted-foreground">{cohortName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/30">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            LIVE
          </Badge>
          <span className="font-mono text-sm text-muted-foreground">{duration}</span>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <span className="text-xs text-muted-foreground">
              {studentCount} {studentCount === 1 ? 'student' : 'students'} live
            </span>
          ) : (
            <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30">
              Reconnecting…
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmEnd(true)}
          >
            End Session
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-card/50 px-4 py-2">
            <Input
              value={symbolDraft}
              onChange={(e) => setSymbolDraft(e.target.value)}
              onBlur={applySymbol}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="h-8 w-32 font-mono text-sm"
              placeholder="MES1!"
            />
            <div className="flex items-center gap-1">
              {TF_OPTIONS.map((t) => (
                <Button
                  key={t.value}
                  variant={timeframe === t.value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setTimeframe(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div ref={chartContainerRef} className="flex-1 bg-background" />
        </main>

        <aside className="hidden w-60 shrink-0 border-l border-border bg-card p-4 lg:block">
          <h2 className="text-sm font-semibold mb-3">Students ({studentUsers.length})</h2>
          {studentUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No students have joined yet</p>
          ) : (
            <ul className="space-y-2">
              {studentUsers.map((u, i) => (
                <li key={(u.presence_ref ?? '') + i} className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    S
                  </div>
                  <span className="text-sm">Student {i + 1}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="border-t border-border bg-card p-3 lg:hidden">
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => setConfirmEnd(true)}
        >
          End Session
        </Button>
      </div>

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session will be closed for all students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleEnd}
              disabled={endSession.isPending}
            >
              {endSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'End Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
