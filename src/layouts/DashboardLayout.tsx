import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import DevTierSwitcher from '@/components/dev/DevTierSwitcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <header className="h-10 flex items-center border-b border-border bg-card shrink-0">
            <SidebarTrigger className="ml-2 text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <DevTierSwitcher />
    </SidebarProvider>
  );
}
