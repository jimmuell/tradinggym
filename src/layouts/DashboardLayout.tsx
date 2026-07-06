import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import DevTierSwitcher from '@/components/dev/DevTierSwitcher';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

const DEV_MENU_KEY = 'dev-menu-visible';

function getStoredDevMenu(): boolean {
  try {
    return localStorage.getItem(DEV_MENU_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [devMenuVisible, setDevMenuVisible] = useState(getStoredDevMenu);

  useEffect(() => {
    try {
      localStorage.setItem(DEV_MENU_KEY, String(devMenuVisible));
      window.dispatchEvent(new Event('dev-menu-visibility-change'));
    } catch {
      /* ignore */
    }
  }, [devMenuVisible]);


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-10 flex items-center justify-between border-b border-border bg-card shrink-0 px-2">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] gap-1 h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setDevMenuVisible((v) => !v)}
            >
              <Bug className="h-3.5 w-3.5" />
              Dev
            </Button>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      {devMenuVisible && <DevTierSwitcher />}
    </SidebarProvider>
  );
}
