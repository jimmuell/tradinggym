import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth?redirect=/companion" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-3 py-2 border-b border-border flex items-baseline gap-2 shrink-0">
        <span className="text-sm font-semibold tracking-tight">TradingGYM</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Companion
        </span>
      </header>
      <main className="px-3 py-2">{children}</main>
    </div>
  );
}
