import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  FlaskConical,
  GraduationCap,
  FolderOpen,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
  CandlestickChart,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Simulator', url: '/simulator', icon: CandlestickChart },
  { title: 'Strategies', url: '/strategies', icon: BookOpen },
  { title: 'Backtesting', url: '/backtesting', icon: FlaskConical },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Coaching', url: '/coaching', icon: GraduationCap },
  { title: 'Resources', url: '/resources', icon: FolderOpen },
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <CandlestickChart className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-sidebar-foreground font-bold text-lg tracking-tight">TradingGym</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider px-4">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-3">
        <div className="border-t border-sidebar-border pt-3 mb-2">
          <SidebarMenu>
            {bottomItems.map((item) => (
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
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
