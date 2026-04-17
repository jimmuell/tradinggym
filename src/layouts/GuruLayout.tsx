import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  DollarSign,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/guru', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { to: '/guru/cohorts', label: 'Cohorts', icon: GraduationCap, enabled: true },
  { to: '/guru/students', label: 'Students', icon: Users, enabled: true },
  { to: '/guru/content', label: 'Content', icon: BookOpen, enabled: false },
  { to: '/guru/sessions', label: 'Sessions', icon: Video, enabled: false },
  { to: '/guru/revenue', label: 'Revenue', icon: DollarSign, enabled: false },
  { to: '/guru/settings', label: 'Settings', icon: Settings, enabled: false },
];

export default function GuruLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Guru';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        {/* Brand */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <span className="text-lg font-bold tracking-tight">TradingGYM</span>
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15">
            Guru
          </Badge>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            if (!item.enabled) {
              return (
                <div
                  key={item.to}
                  className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm opacity-40"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/guru'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-amber-500/15 text-amber-400 text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-foreground">{displayName}</span>
          </div>
          <Link
            to="/dashboard"
            className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background p-8">{children}</main>
    </div>
  );
}
