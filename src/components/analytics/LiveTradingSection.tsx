import { Activity, DollarSign, TrendingDown, Target, LineChart as LineIcon, BarChart3, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SessionAnalytics, SessionSummary } from '@/hooks/useSessionAnalytics';
import { SessionNetPnlChart } from './SessionNetPnlChart';
import { FeeDragChart } from './FeeDragChart';

const fmtCurrency = (v: number) => `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`;
const fmtSignedCurrency = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;

function feeDragColor(pct: number): string {
  if (pct > 50) return 'text-destructive';
  if (pct > 30) return 'text-amber-500';
  return 'text-emerald-500';
}

function pnlColor(v: number): string {
  if (v > 0) return 'text-emerald-500';
  if (v < 0) return 'text-destructive';
  return 'text-foreground';
}

function durationLabel(start: string, end: string | null): string {
  if (!end) return 'Active';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SessionCard({ s }: { s: SessionSummary }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {formatLongDate(s.started_at)}
          </div>
          <div className="text-xs text-muted-foreground">
            {s.tradeCount} trade{s.tradeCount === 1 ? '' : 's'} · {durationLabel(s.started_at, s.ended_at)}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="text-muted-foreground">Gross:</span>
          <span className={cn('font-semibold', pnlColor(s.grossPnl))}>
            {fmtSignedCurrency(s.grossPnl)}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">Net:</span>
          <span className={cn('font-semibold', pnlColor(s.netPnl))}>
            {fmtSignedCurrency(s.netPnl)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Fee Drag:</span>
          <span className={cn('font-semibold', feeDragColor(s.feeDragPct))}>
            {s.feeDragPct.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {s.checklist_session_id ? (
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Checklist linked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              No checklist
            </span>
          )}
          <span>·</span>
          <span>Win Rate: {s.winRate.toFixed(0)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  data: SessionAnalytics;
}

export default function LiveTradingSection({ data }: Props) {
  const showSkeletons = data.isLoading && data.totalSessions === 0;

  const stats = [
    {
      label: 'Live Sessions',
      value: String(data.totalSessions),
      icon: Activity,
      className: 'text-foreground',
    },
    {
      label: 'Net P&L',
      value: fmtSignedCurrency(data.totalNet),
      icon: DollarSign,
      className: pnlColor(data.totalNet),
    },
    {
      label: 'Avg Fee Drag',
      value: `${data.avgFeeDrag.toFixed(1)}%`,
      icon: TrendingDown,
      className: feeDragColor(data.avgFeeDrag),
    },
    {
      label: 'Plan Adherence',
      value: `${data.planAdherencePct.toFixed(0)}%`,
      icon: Target,
      className: 'text-foreground',
    },
  ];

  const recent = data.sessions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {showSkeletons
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3 px-4">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))
          : stats.map((m) => (
              <Card key={m.label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className={cn('text-lg font-bold', m.className)}>{m.value}</span>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Daily Net P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showSkeletons ? (
              <Skeleton className="h-48 w-full" />
            ) : data.dailyNetPnl.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center border border-dashed rounded-md">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No live trading sessions yet</p>
              </div>
            ) : (
              <SessionNetPnlChart data={data.dailyNetPnl} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LineIcon className="h-4 w-4 text-primary" />
              Fee Drag Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showSkeletons ? (
              <Skeleton className="h-48 w-full" />
            ) : data.feeDragTrend.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center border border-dashed rounded-md">
                <LineIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Fee impact will appear here</p>
              </div>
            ) : (
              <FeeDragChart data={data.feeDragTrend} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Sessions</h3>
        {showSkeletons ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3 px-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full max-w-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No live trading sessions yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Launch TradingGYM Live to start tracking your real P&L.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((s) => (
              <SessionCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
