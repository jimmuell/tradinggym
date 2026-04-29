import { Navigate, useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Ticket, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

type OverviewStats = {
  total_users: number;
  pending_applications: number;
  active_invites: number;
  pro_plus_users: number;
};

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview-stats'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_overview_stats');
      if (error) throw error;
      return data as unknown as OverviewStats;
    },
  });

  if (roleLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const cards = [
    { label: 'Total Users', value: data?.total_users ?? 0, icon: Users, accent: 'text-primary' },
    { label: 'Pending Guru Applications', value: data?.pending_applications ?? 0, icon: GraduationCap, accent: 'text-amber-500' },
    { label: 'Active Invite Codes', value: data?.active_invites ?? 0, icon: Ticket, accent: 'text-emerald-500' },
    { label: 'Pro+ Users', value: data?.pro_plus_users ?? 0, icon: Crown, accent: 'text-purple-500' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">Platform operations summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{c.label}</span>
                  <Icon className={`h-4 w-4 ${c.accent}`} />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{c.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <Users className="h-4 w-4 mr-2" /> Manage Users
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/gurus')}>
            <GraduationCap className="h-4 w-4 mr-2" /> Review Guru Applications
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/invites')}>
            <Ticket className="h-4 w-4 mr-2" /> Manage Invite Codes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
