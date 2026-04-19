import { useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentCohort } from '@/hooks/useStudentEnrollments';
import { useCohortSessions } from '@/hooks/useCohortSessions';
import { useSessionBroadcast } from '@/hooks/useSessionBroadcast';
import { loadTimeframeData, type Timeframe } from '@/lib/chartData';

const BROADCAST_TF_MAP: Record<string, Timeframe> = {
  '1': '1m',
  '5': '5m',
  '15': '5m',
  '30': '30m',
  '60': '1h',
  '1H': '1h',
  '240': '1h',
  '4H': '1h',
  '1D': '1D',
  D: '1D',
};

function resolveTimeframe(tf: string): Timeframe {
  return BROADCAST_TF_MAP[tf] ?? '5m';
}

export default function ClassSessionPage() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enrolled, isLoading: enrLoading } = useStudentCohort(classId);
  const { sessions, isLoading: sessionsLoading } = useCohortSessions(classId);

  const session = sessions.find((s) => s.id === sessionId) ?? null;

  const { chartState, isConnected } = useSessionBroadcast(
    session?.status === 'live' ? sessionId : undefined,
    'viewer',
  );

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const loadedTfRef = useRef<Timeframe | null>(null);

  const statusQuery = useQuery({
    queryKey: ['session-status-poll', sessionId],
    queryFn: async (): Promise<{ status: string } | null> => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from('live_sessions')
        .select('status')
        .eq('id', sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (statusQuery.data?.status === 'ended') {
      toast.info('This session has ended');
      const t = setTimeout(() => navigate(`/classes/${classId}`), 3000);
      return () => clearTimeout(t);
    }
  }, [statusQuery.data?.status, classId, navigate]);

  useEffect(() => {
    if (!user?.id || !sessionId || !session || session.status !== 'live') return;
    let cancelled = false;
    const studentId = user.id;
    const sid = sessionId;

    (async () => {
      const { error } = await supabase
        .from('live_session_attendance')
        .upsert(
          { session_id: sid, student_id: studentId, joined_at: new Date().toISOString(), left_at: null },
          { onConflict: 'session_id,student_id' },
        );
      if (error && !cancelled) {
        console.error('attendance upsert failed', error);
      }
    })();

    return () => {
      cancelled = true;
      void supabase
        .from('live_session_attendance')
        .update({ left_at: new Date().toISOString() })
        .eq('session_id', sid)
        .eq('student_id', studentId);
    };
  }, [user?.id, sessionId, session]);

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
      handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: false, axisPressedMouseMove: false, axisDoubleClickReset: false },
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

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      loadedTfRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartState || !chartRef.current || !seriesRef.current) return;
    const tf = resolveTimeframe(chartState.timeframe);

    let cancelled = false;
    const apply = async () => {
      if (loadedTfRef.current !== tf) {
        const data = await loadTimeframeData(tf);
        if (cancelled) return;
        seriesRef.current?.setData(data);
        loadedTfRef.current = tf;
      }
      try {
        chartRef.current?.timeScale().setVisibleRange({
          from: chartState.fromTimestamp as Time,
          to: chartState.toTimestamp as Time,
        });
      } catch {
        // Range outside data — ignore
      }
    };
    void apply();
    return () => {
      cancelled = true;
    };
  }, [chartState]);

  if (enrLoading || sessionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enrolled) return <Navigate to="/classes" replace />;
  if (!session) {
    toast.error('This session is not currently live');
    return <Navigate to={`/classes/${classId}`} replace />;
  }
  if (session.status !== 'live') {
    toast.error('This session is not currently live');
    return <Navigate to={`/classes/${classId}`} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold truncate">{session.title}</h1>
          <p className="text-xs text-muted-foreground truncate">
            Viewing {enrolled.guru.display_name}'s chart · {enrolled.cohort.name}
          </p>
        </div>
        <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/30">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          LIVE
        </Badge>
        <Button asChild variant="outline" size="sm">
          <Link to={`/classes/${classId}`}>Leave Session</Link>
        </Button>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div ref={chartContainerRef} className="absolute inset-0 bg-background" />
        {!chartState && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Waiting for your Guru to share their chart…
              </p>
            </div>
          </div>
        )}
        {!isConnected && chartState && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-md border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-400">
            Connection lost — reconnecting…
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card px-6 py-3">
        <p className="text-xs text-muted-foreground">
          Audio/video: Join your Guru's Discord or Zoom for audio
        </p>
      </footer>
    </div>
  );
}
