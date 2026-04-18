import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function StripeConnectCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Stripe Payouts</CardTitle>
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15">
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Direct payouts to your bank account via Stripe Connect are coming soon.
          Once enabled, you'll receive your earnings automatically after each
          billing cycle.
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button disabled variant="secondary">
                  Set Up Stripe Payouts
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Stripe payouts will be available at launch.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
