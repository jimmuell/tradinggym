import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, FolderLock, Map } from 'lucide-react';
import { useTopInvestorNotes } from '@/hooks/useInvestorNotes';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function InvestorDashboardPage() {
  const { data: notes, isLoading } = useTopInvestorNotes(3);

  const kpis = [
    { label: 'Total Users', value: '—' },
    { label: 'MRR', value: '—' },
    { label: 'Guru Partners', value: '—' },
    { label: 'Monthly Growth', value: '—' },
  ];

  const links = [
    { to: '/investor/kpis', title: 'Platform KPIs', desc: 'Drill into growth, retention, and revenue metrics', icon: BarChart3 },
    { to: '/investor/data-room', title: 'Data Room', desc: 'Pitch deck, financials, and market analysis', icon: FolderLock },
    { to: '/investor/roadmap', title: 'Product Roadmap', desc: "What we're building and when", icon: Map },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to TradingGYM Investor Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Real-time platform metrics, investment materials, and direct communication with the team.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KPI Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-md border border-border p-4">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="text-2xl font-bold mt-1">{k.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Live data coming soon</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <l.icon className="h-4 w-4" /> {l.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{l.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle>Recent Notes</CardTitle>
          <Link to="/investor/notes" className="text-xs text-primary hover:underline">
            View all notes →
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !notes || notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notes yet. Start a conversation using the Notes & Q&A section.
            </p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="border border-border rounded-md p-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium">{n.author_name || 'Anonymous'}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {n.content.length > 100 ? `${n.content.slice(0, 100)}…` : n.content}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
