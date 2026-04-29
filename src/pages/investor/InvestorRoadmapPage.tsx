import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestorKpis } from '@/hooks/useInvestorKpis';

type Status = 'done' | 'in_progress' | 'planned';

const phases: { key: string; name: string; prompts: string; status: Status; desc: string }[] = [
  { key: 'A', name: 'Foundation Fixes', prompts: 'P1–P6', status: 'done', desc: 'Core scaffolding and bug sweep.' },
  { key: 'B', name: 'Dev Tools', prompts: 'P4–P6', status: 'done', desc: 'Internal tooling and tier switcher.' },
  { key: 'C', name: 'Dashboard', prompts: 'P7–P8', status: 'done', desc: 'User home with progress and CTAs.' },
  { key: 'D', name: 'Learning Path', prompts: 'P9–P10', status: 'done', desc: 'Tiered curriculum and quizzes.' },
  { key: 'E', name: 'Simulator Completion', prompts: 'P11–P13', status: 'done', desc: 'Full chart, replay, and trade engine.' },
  { key: 'F', name: 'Supporting Pages', prompts: 'P14–P20', status: 'done', desc: 'Profile, settings, analytics, resources.' },
  { key: 'G', name: 'Guru Platform', prompts: 'P21–P35', status: 'done', desc: 'Coach onboarding, classes, students.' },
  { key: 'H', name: 'Stripe & Payments', prompts: 'P30–P34', status: 'done', desc: 'Subscriptions and Stripe Connect payouts.' },
  { key: 'I', name: 'Strategy Playback + Form', prompts: 'P55–P60', status: 'done', desc: 'Step-through trainer and rich strategy form.' },
  { key: 'J', name: 'Landing + Pine Script Export', prompts: 'P58–P61', status: 'done', desc: 'Public landing and TradingView export.' },
  { key: 'K', name: 'Admin + Investor Portal', prompts: 'P62–P64', status: 'in_progress', desc: 'Internal dashboards and investor reporting.' },
  { key: 'L', name: 'Launch Prep', prompts: '—', status: 'planned', desc: 'Guru onboarding, legal, custom domain.' },
];

const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function StatusIcon({ s }: { s: Status }) {
  if (s === 'done') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (s === 'in_progress') return <Clock className="h-5 w-5 text-primary" />;
  return <Circle className="h-5 w-5 text-muted-foreground" />;
}

function StatusLabel({ s }: { s: Status }) {
  if (s === 'done') return <span className="text-xs text-emerald-500 font-medium">Complete</span>;
  if (s === 'in_progress') return <span className="text-xs text-primary font-medium">In Progress</span>;
  return <span className="text-xs text-muted-foreground font-medium">Planned</span>;
}

export default function InvestorRoadmapPage() {
  const { data, isLoading } = useInvestorKpis();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Product Roadmap</h1>
        <p className="text-sm text-muted-foreground">Phases shipped and what's next</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-[14px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {phases.map((p) => (
                <div key={p.key} className="relative pl-10">
                  <div className="absolute left-0 top-1">
                    <StatusIcon s={p.status} />
                  </div>
                  <div className="rounded-md border border-border/60 bg-card/40 p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-semibold text-sm">
                        Phase {p.key}: {p.name}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{p.prompts}</span>
                        <StatusLabel s={p.status} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Current Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Admin dashboard and investor portal (Phase K). Platform is feature-complete for beta. Next: Guru
            partner onboarding, Stripe test matrix, legal review, custom domain connection.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traction Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-md border border-border/60 p-4">
                <div className="text-xs text-muted-foreground">MRR</div>
                <div className="text-2xl font-bold mt-1">{money(data.mrr)}</div>
              </div>
              <div className="rounded-md border border-border/60 p-4">
                <div className="text-xs text-muted-foreground">Total Users</div>
                <div className="text-2xl font-bold mt-1">{fmt(data.total_users)}</div>
              </div>
              <div className="rounded-md border border-border/60 p-4">
                <div className="text-xs text-muted-foreground">Conversion Rate</div>
                <div className="text-2xl font-bold mt-1">{data.conversion_rate}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
