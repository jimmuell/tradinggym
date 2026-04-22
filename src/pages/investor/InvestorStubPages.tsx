import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function StubShell({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link to="/investor" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Overview
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function InvestorKpisStubPage() {
  return (
    <StubShell
      title="Platform KPIs"
      message="Detailed KPI dashboards coming soon. Key metrics will include MRR breakdown, user growth cohorts, retention curves, and Guru platform economics."
    />
  );
}
export function InvestorDataRoomStubPage() {
  return (
    <StubShell
      title="Data Room"
      message="Data room coming soon. This section will host pitch decks, financial projections, market analysis, and team information."
    />
  );
}
export function InvestorRoadmapStubPage() {
  return (
    <StubShell
      title="Product Roadmap"
      message="Product roadmap coming soon. View completed milestones, current sprint, and planned features."
    />
  );
}
