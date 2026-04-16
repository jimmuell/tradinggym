import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  FlaskConical,
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
  CandlestickChart,
  Lock,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const LOCK_MESSAGES: Record<string, string> = {
  simulator: 'Complete Foundation to unlock',
  strategies: 'Complete Foundation to unlock',
  analytics: 'Complete Foundation to unlock',
  backtesting: 'Complete Tier 1 to unlock',
  coaching: 'Coach accounts only',
};

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, feature: null },
  { title: 'Learning', url: '/learning', icon: BookOpenCheck, feature: null },
  { title: 'Simulator', url: '/simulator', icon: CandlestickChart, feature: 'simulator' },
  { title: 'Strategies', url: '/strategies', icon: BookOpen, feature: 'strategies' },
  { title: 'Backtesting', url: '/backtesting', icon: FlaskConical, feature: 'backtesting' },
  { title: 'Analytics', url: '/analytics', icon: BarChart3, feature: 'analytics' },
  { title: 'Coaching', url: '/coaching', icon: GraduationCap, feature: 'coaching' },
  { title: 'Resources', url: '/resources', icon: BookOpenCheck, feature: null },
];

const bottomItems = [
  { title: 'Profile', url: '/profile', icon: UserCircle },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { canAccess } = useTier();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const initials = (profile?.display_name || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <CandlestickChart className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-sidebar-foreground font-bold text-lg tracking-tight">TradeGym</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const locked = item.feature ? !canAccess(item.feature) : false;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        onClick={(e: React.MouseEvent) => {
                          if (locked) {
                            e.preventDefault();
                            toast(LOCK_MESSAGES[item.feature!] || 'Feature locked');
                          }
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                          isActive(item.url)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        } ${locked ? 'opacity-50' : ''}`}
                        activeClassName=""
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span>{item.title}</span>
                            {locked && <Lock size={12} className="ml-auto opacity-50" />}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-3">
        <div className="border-t border-sidebar-border pt-3 mb-2">
          <SidebarMenu>
            {bottomItems.map((item) => {
              const isProfile = item.url === '/profile';
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                        isActive(item.url)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`}
                      activeClassName=""
                    >
                      {isProfile ? (
                        <Avatar className="h-5 w-5 shrink-0">
                          {profile?.avatar_url && (
                            <AvatarImage src={profile.avatar_url} alt={profile?.display_name || 'Profile'} />
                          )}
                          <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <item.icon className="h-4 w-4 shrink-0" />
                      )}
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
        <div className="border-t border-sidebar-border pt-3">
          {!collapsed && user && (
            <div className="text-xs text-muted-foreground truncate mb-2 px-1">
              {user.email}
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-muted-foreground hover:text-sidebar-foreground text-sm px-1 py-1.5 w-full transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}