import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const stats = [
    { label: 'Total Users', value: '—' },
    { label: 'Active Subscriptions', value: '—' },
    { label: 'Active Gurus', value: '—' },
    { label: 'MRR', value: '—' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform operations overview</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-md border border-border p-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-2xl font-bold mt-1">{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Coming soon</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>Manage Users</Button>
          <Button variant="outline" onClick={() => navigate('/admin/gurus')}>Review Guru Applications</Button>
          <Button variant="outline" onClick={() => navigate('/admin/revenue')}>View Revenue</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Recent signups, Guru applications, and subscription events will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
