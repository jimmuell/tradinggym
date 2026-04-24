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
  Users,
  Crown,
  Sparkles,
  Brain,
  Shield,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useUserRole } from '@/hooks/useUserRole';
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
};


const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, feature: null },
  { title: 'Learning', url: '/learning', icon: BookOpenCheck, feature: null },
  { title: 'Simulator', url: '/simulator', icon: CandlestickChart, feature: 'simulator' },
  { title: 'Strategies', url: '/strategies', icon: BookOpen, feature: 'strategies' },
  { title: 'AI Extract', url: '/strategies/extract', icon: Sparkles, feature: null, proGated: true },
  { title: 'Backtesting', url: '/backtesting', icon: FlaskConical, feature: 'backtesting' },
  { title: 'Analytics', url: '/analytics', icon: BarChart3, feature: 'analytics' },
  { title: 'My Classes', url: '/classes', icon: GraduationCap, feature: null },
  { title: 'My Coaching', url: '/coaching', icon: Brain, feature: null },
  { title: 'Find a Guru', url: '/gurus', icon: Users, feature: null },
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
  const { canAccess, planState } = useTier();
  const { data: guruProfile } = useGuruProfile();
  const { isAdmin } = useUserRole();
  const isActiveGuru = guruProfile?.status === 'active';
  const adminItems = [
    { title: 'Dashboard', url: '/admin' },
    { title: 'Users', url: '/admin/users' },
    { title: 'Gurus', url: '/admin/gurus' },
    { title: 'Revenue', url: '/admin/revenue' },
  ];
  const showPricingLink = planState !== 'guru';

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
          <img
            src="/favicon.png"
            alt="TradingGYM logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md shrink-0"
          />
          {!collapsed && (
            <span className="text-sidebar-foreground font-bold text-lg tracking-tight">
              Trading<span className="text-primary">GYM</span>
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const proGatedLocked = item.proGated ? planState === 'starter' : false;
                const featureLocked = item.feature ? !canAccess(item.feature) : false;
                const locked = proGatedLocked || featureLocked;
                const Icon = proGatedLocked ? Lock : item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        onClick={(e: React.MouseEvent) => {
                          if (locked) {
                            e.preventDefault();
                            if (proGatedLocked) {
                              toast('Upgrade to Pro to unlock AI Strategy Extraction');
                            } else {
                              toast(LOCK_MESSAGES[item.feature!] || 'Feature locked');
                            }
                          }
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                          isActive(item.url)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        } ${locked ? 'opacity-50' : ''}`}
                        activeClassName=""
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span>{item.title}</span>
                            {featureLocked && <Lock size={12} className="ml-auto opacity-50" />}
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
              {!collapsed && 'Admin'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item, idx) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/admin'}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                          isActive(item.url)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }`}
                        activeClassName=""
                      >
                        {idx === 0 ? <Shield className="h-4 w-4 shrink-0" /> : <span className="w-4" />}
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isActiveGuru && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
              {!collapsed && 'Guru'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/guru"
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                        location.pathname.startsWith('/guru')
                          ? 'bg-amber-500/15 text-amber-500 font-medium'
                          : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                      }`}
                      activeClassName=""
                    >
                      <Crown className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Guru Dashboard</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
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
            {showPricingLink && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/pricing"
                    end
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                      isActive('/pricing')
                        ? 'bg-sidebar-accent text-blue-400 font-medium'
                        : 'text-blue-400 hover:text-blue-300 hover:bg-sidebar-accent/50'
                    }`}
                    activeClassName=""
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Upgrade</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
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