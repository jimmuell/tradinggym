import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, ExternalLink, Monitor } from 'lucide-react';
import { useTier } from '@/contexts/TierContext';
import { useTodayChecklistSession } from '@/hooks/useChecklistSession';

export default function LaunchSessionCard() {
  const { planState, isAdmin, loading: tierLoading } = useTier();
  const { data: session, isLoading: sessionLoading } = useTodayChecklistSession();

  if (tierLoading) {
    return (
      <Card className="border-l-4 border-l-amber-500/60">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>
    );
  }

  const isLocked = !isAdmin && planState === 'starter';
  // Don't render at all for free users — subscription card handles upgrade CTA
  if (isLocked) return null;

  const hasActiveSession = !!session && !sessionLoading;

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-md flex items-center justify-center shrink-0 bg-amber-500/15">
          <Radio className="h-5 w-5 text-amber-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Live Trading Session</p>
            {hasActiveSession && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-green-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Active today
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Launch TradingGYM Live to run your pre-trade checklist, log trades, and track net P&L alongside your trading platform.
          </p>

          <div className="mt-3">
            <Button
              size="sm"
              onClick={() => {
                window.location.href = 'tradinggym://launch';
              }}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              {hasActiveSession ? 'Resume Session' : 'Launch Session'}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
            Opens TradingGYM Live desktop app —{' '}
            <a href="#" className="underline hover:text-foreground inline-flex items-center gap-0.5">
              download it here <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
