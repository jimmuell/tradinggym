import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useStripeConnect } from '@/hooks/useStripeConnect';

export function StripeConnectCard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    status,
    chargesEnabled,
    payoutsEnabled,
    isLoading,
    startOnboarding,
    refreshStatus,
  } = useStripeConnect();

  useEffect(() => {
    const connectParam = searchParams.get('connect');
    if (connectParam === 'complete') {
      refreshStatus();
      toast({ title: 'Checking your Stripe account…' });
      setSearchParams({}, { replace: true });
    } else if (connectParam === 'refresh') {
      toast({
        title: 'Onboarding incomplete',
        description: 'Click "Continue Setup" to finish connecting your account.',
        variant: 'destructive',
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshStatus]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Stripe Payouts</CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'not_started' && (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to receive your 80% share of student
              subscription revenue. Payouts are processed automatically after
              each billing cycle.
            </p>
            <Button
              onClick={() => startOnboarding.mutate()}
              disabled={startOnboarding.isPending}
            >
              {startOnboarding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Set Up Stripe Payouts
                </>
              )}
            </Button>
          </>
        )}

        {status === 'pending' && (
          <>
            <p className="text-sm text-muted-foreground">
              Your Stripe account setup is not yet complete. Click below to
              continue where you left off.
            </p>
            <Button
              onClick={() => startOnboarding.mutate()}
              disabled={startOnboarding.isPending}
            >
              {startOnboarding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Continue Setup
                </>
              )}
            </Button>
          </>
        )}

        {status === 'active' && (
          <>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Your Stripe account is connected and ready to receive payouts.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Charges enabled: {chargesEnabled ? 'Yes' : 'No'}</p>
              <p>Payouts enabled: {payoutsEnabled ? 'Yes' : 'No'}</p>
            </div>
          </>
        )}

        {status === 'restricted' && (
          <>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Your Stripe account needs attention. Additional information may
              be required.
            </p>
            <Button
              variant="destructive"
              onClick={() => startOnboarding.mutate()}
              disabled={startOnboarding.isPending}
            >
              {startOnboarding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Stripe…
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Resolve in Stripe
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/15">
          Connected
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15">
          Pending
        </Badge>
      );
    case 'restricted':
      return (
        <Badge className="bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/15">
          Needs Attention
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">Not Connected</Badge>
      );
  }
}
