import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { useTier } from '@/contexts/TierContext';

export function PastDueBanner({ returnPath = '/settings' }: { returnPath?: string }) {
  const { paymentPastDue } = useTier();
  const portal = useCustomerPortal();

  if (!paymentPastDue) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3"
    >
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          Your last payment didn't go through
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          We couldn't charge your card. You still have full access — update your payment method to avoid losing it.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-2 border-amber-500/50 text-foreground hover:bg-amber-500/20"
        onClick={() => portal.mutate(`${window.location.origin}${returnPath}`)}
        disabled={portal.isPending}
      >
        {portal.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ExternalLink className="h-4 w-4" />
            Update payment method
          </>
        )}
      </Button>
    </div>
  );
}
