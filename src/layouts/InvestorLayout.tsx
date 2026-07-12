import { Navigate, NavLink, useLocation } from 'react-router-dom';
import { LogOut, BarChart3, FolderOpen, Map, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const items = [
  { to: '/investor/kpis', label: 'KPIs', icon: BarChart3 },
  { to: '/investor/data-room', label: 'Data Room', icon: FolderOpen },
  { to: '/investor/roadmap', label: 'Roadmap', icon: Map },
  { to: '/investor/notes', label: 'Notes & Q&A', icon: MessageSquare },
];

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  const { session, user, signOut, loading } = useAuth();
  const { isAdmin, isInvestor, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth?redirect=/investor" replace />;
  if (!isAdmin && !isInvestor) return <Navigate to="/dashboard" replace />;

  const initials = (profile?.display_name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 border-b border-border px-6 flex items-center justify-between shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-bold tracking-tight">
            Trading<span className="text-primary">GYM</span>
          </span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Investor Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-7 w-7">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {profile?.display_name || user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={() => { signOut().catch(() => { /* toast shown in signOut */ }); }}>
            <LogOut className="h-4 w-4 mr-1" /> Sign out
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="w-56 border-r border-border p-3 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors mb-2 border-b border-border pb-3"
              >
                <ShieldCheck className="h-4 w-4" />
                Back to Admin
              </NavLink>
            )}
            {items.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
