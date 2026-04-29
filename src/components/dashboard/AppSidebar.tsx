import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  FlaskConical,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  Lock,
  Users,
  Crown,
  Sparkles,
  Shield,
  Target,
  Search,
  User,
  ChevronDown,
  ChevronRight,
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
import { Skeleton } from '@/components/ui/skeleton';
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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { canAccess, planState, isAdmin: isAdminPlan, loading: tierLoading } = useTier();
  const { data: guruProfile } = useGuruProfile();
  const { isAdmin } = useUserRole();
  const isActiveGuru = guruProfile?.status === 'active';
  const showGuruSection = isActiveGuru || isAdmin || isAdminPlan;
  const showPricingLink = !isAdminPlan && !isAdmin && planState !== 'guru';
  const path = location.pathname;

  const strategiesActive = path.startsWith('/strategies') || path.startsWith('/backtesting');
  const classesActive = path.startsWith('/classes') || path.startsWith('/gurus');

  // Manual override: when user explicitly toggles via chevron, respect that choice
  // until they navigate from outside the section back into it.
  const [strategiesOpen, setStrategiesOpen] = useState(strategiesActive);
  const [classesOpen, setClassesOpen] = useState(classesActive);
  const prevStrategiesActive = useRef(strategiesActive);
  const prevClassesActive = useRef(classesActive);

  useEffect(() => {
    // Auto-expand only when transitioning from outside -> inside the section
    if (strategiesActive && !prevStrategiesActive.current) {
      setStrategiesOpen(true);
    }
    prevStrategiesActive.current = strategiesActive;
  }, [strategiesActive]);

  useEffect(() => {
    if (classesActive && !prevClassesActive.current) {
      setClassesOpen(true);
    }
    prevClassesActive.current = classesActive;
  }, [classesActive]);

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

  const isActive = (p: string) => path === p;

  const itemClass = (active: boolean, locked = false) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
      active
        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
        : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
    } ${locked ? 'opacity-50' : ''}`;

  const subItemClass = (active: boolean, locked = false) =>
    `flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${
      active
        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
        : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
    } ${locked ? 'opacity-50' : ''}`;

  const adminItems = [
    { title: 'Overview', url: '/admin' },
    { title: 'Users', url: '/admin/users' },
    { title: 'Guru Applications', url: '/admin/gurus' },
    { title: 'Invite Codes', url: '/admin/invites' },
  ];

  // AI Extract lock state
  const aiExtractLocked = !isAdminPlan && !isAdmin && planState === 'starter';
  const backtestingLocked = !canAccess('backtesting');
  const simulatorLocked = !canAccess('simulator');
  const strategiesLocked = !canAccess('strategies');
  const analyticsLocked = !canAccess('analytics');

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

        {/* TRADE section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && 'Trade'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" end className={itemClass(isActive('/dashboard'))} activeClassName="">
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Simulator */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/simulator"
                    end
                    onClick={(e: React.MouseEvent) => {
                      if (simulatorLocked) {
                        e.preventDefault();
                        toast(LOCK_MESSAGES.simulator);
                      }
                    }}
                    className={itemClass(isActive('/simulator'), simulatorLocked)}
                    activeClassName=""
                  >
                    <LineChart className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span>Simulator</span>
                        {simulatorLocked && <Lock size={12} className="ml-auto opacity-50" />}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Strategies (parent with chevron) */}
              <SidebarMenuItem>
                <div className="flex items-center">
                  <SidebarMenuButton asChild className="flex-1">
                    <NavLink
                      to="/strategies"
                      end
                      onClick={(e: React.MouseEvent) => {
                        if (strategiesLocked) {
                          e.preventDefault();
                          toast(LOCK_MESSAGES.strategies);
                          return;
                        }
                        setStrategiesOpen(true);
                      }}
                      className={itemClass(isActive('/strategies'), strategiesLocked)}
                      activeClassName=""
                    >
                      <Target className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span>Strategies</span>
                          {strategiesLocked && <Lock size={12} className="ml-auto opacity-50" />}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => setStrategiesOpen((v) => !v)}
                      aria-label="Toggle strategies"
                      className="p-1 mr-2 text-muted-foreground hover:text-sidebar-foreground"
                    >
                      {strategiesOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </SidebarMenuItem>

              {!collapsed && strategiesOpen && (
                <div className="ml-6 border-l-2 border-border pl-2 space-y-0.5">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/strategies/extract"
                        end
                        onClick={(e: React.MouseEvent) => {
                          if (aiExtractLocked) {
                            e.preventDefault();
                            toast('Upgrade to Pro to unlock AI Strategy Extraction');
                          }
                        }}
                        className={subItemClass(isActive('/strategies/extract'), aiExtractLocked)}
                        activeClassName=""
                      >
                        {aiExtractLocked ? (
                          <Lock className="h-4 w-4 shrink-0" />
                        ) : (
                          <Sparkles className="h-4 w-4 shrink-0" />
                        )}
                        <span>AI Extract</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/backtesting"
                        end
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          toast('Backtesting is coming soon');
                        }}
                        className={subItemClass(isActive('/backtesting'), false)}
                        activeClassName=""
                      >
                        <FlaskConical className="h-4 w-4 shrink-0" />
                        <span>Backtesting</span>
                        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Coming Soon
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              )}

              {/* Analytics */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/analytics"
                    end
                    onClick={(e: React.MouseEvent) => {
                      if (analyticsLocked) {
                        e.preventDefault();
                        toast(LOCK_MESSAGES.analytics);
                      }
                    }}
                    className={itemClass(isActive('/analytics'), analyticsLocked)}
                    activeClassName=""
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span>Analytics</span>
                        {analyticsLocked && <Lock size={12} className="ml-auto opacity-50" />}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* LEARN section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && 'Learn'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/learning" end className={itemClass(isActive('/learning'))} activeClassName="">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Learning</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Classes (parent with chevron) */}
              <SidebarMenuItem>
                <div className="flex items-center">
                  <SidebarMenuButton asChild className="flex-1">
                    <NavLink
                      to="/classes"
                      end
                      onClick={() => setClassesOpen(true)}
                      className={itemClass(isActive('/classes'))}
                      activeClassName=""
                    >
                      <Users className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Classes</span>}
                    </NavLink>
                  </SidebarMenuButton>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => setClassesOpen((v) => !v)}
                      aria-label="Toggle classes"
                      className="p-1 mr-2 text-muted-foreground hover:text-sidebar-foreground"
                    >
                      {classesOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </SidebarMenuItem>

              {!collapsed && (classesOpen || classesActive) && (
                <div className="ml-6 border-l-2 border-border pl-2 space-y-0.5">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/gurus"
                        end
                        className={subItemClass(isActive('/gurus'))}
                        activeClassName=""
                      >
                        <Search className="h-4 w-4 shrink-0" />
                        <span>Find a Guru</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </div>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/resources" end className={itemClass(isActive('/resources'))} activeClassName="">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Resources</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* GURU section */}
        {showGuruSection && (
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
                        path.startsWith('/guru')
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

        {/* ADMIN section */}
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
                        className={itemClass(isActive(item.url))}
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

        {/* ACCOUNT section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && 'Account'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" end className={itemClass(isActive('/settings'))} activeClassName="">
                    <Settings className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/profile" end className={itemClass(isActive('/profile'))} activeClassName="">
                    <User className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-3">
        <div className="border-t border-sidebar-border pt-3 mb-2">
          <SidebarMenu>
            {tierLoading ? (
              <SidebarMenuItem>
                <div className="px-4 py-2">
                  <Skeleton className="h-4 w-24" />
                </div>
              </SidebarMenuItem>
            ) : (
              showPricingLink && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/pricing"
                      end
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                        isActive('/pricing')
                          ? 'bg-sidebar-accent text-amber-400 font-medium'
                          : 'text-amber-400 hover:text-amber-300 hover:bg-sidebar-accent/50'
                      }`}
                      activeClassName=""
                    >
                      <Sparkles className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Upgrade</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </div>
        <div className="border-t border-sidebar-border pt-3">
          {!collapsed && user && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <Avatar className="h-6 w-6 shrink-0">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile?.display_name || 'Profile'} />
                )}
                <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
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
