import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTier, PlanState } from '@/contexts/TierContext';
import { useCreateCheckout } from '@/hooks/useCreateCheckout';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';

const PLAN_PRICE_MAP: Record<string, string> = {
  pro: 'price_1TNtx3LMQSLv70CqmRJaPHCu',
  expert: 'price_1THXB1LMQSLv70CqYTehlVba',
  guru: 'price_REPLACE_WITH_GURU_PRICE_ID',
};

const GURU_PRICE_ID = PLAN_PRICE_MAP.guru;

const PLAN_RANK: Record<PlanState, number> = {
  starter: 0,
  pro: 1,
  expert: 2,
  guru: 3,
};

interface PlanCard {
  key: PlanState;
  name: string;
  price: string;
  period: string;
  highlight: boolean;
  features: string[];
}

const PLANS: PlanCard[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$0',
    period: '/forever',
    highlight: false,
    features: [
      'Trading Simulator',
      'Foundation learning modules',
      '1-minute MES data',
      'Basic equity tracking',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/mo',
    highlight: true,
    features: [
      'Everything in Starter',
      'All strategy tiers (ORB, VWAP, AMD)',
      'AI strategy ingestion',
      'Advanced analytics',
      'Multiple timeframes',
      'Backtesting (engine coming soon)',
    ],
  },
  {
    key: 'expert',
    name: 'Expert',
    price: '$49',
    period: '/mo',
    highlight: false,
    features: [
      'Everything in Pro',
      'Automated execution',
      'Broker integration',
      'Risk controls & kill switch',
      'Monte Carlo validation',
      'Priority support',
      '30-day Guru trial included',
    ],
  },
];

export default function PricingPage() {
  const { planState, loading } = useTier();
  const checkout = useCreateCheckout();
  const portal = useCustomerPortal();

  const currentRank = PLAN_RANK[planState] ?? 0;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upgrade to unlock advanced features and accelerate your trading.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[480px] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => {
              const isCurrent = p.key === planState;
              const isLower = PLAN_RANK[p.key] < currentRank;
              const isUpgrade = PLAN_RANK[p.key] > currentRank;
              const priceId = PLAN_PRICE_MAP[p.key];
              const pending = checkout.isPending && checkout.variables === priceId;

              return (
                <Card
                  key={p.key}
                  className={`bg-card border transition-all ${
                    isCurrent
                      ? 'border-green-500/50 shadow-lg shadow-green-500/10'
                      : p.highlight
                      ? 'border-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'border-border'
                  }`}
                >
                  <CardContent className="p-8 flex flex-col h-full">
                    {isCurrent ? (
                      <Badge className="self-start bg-green-500/10 text-green-500 border-green-500/20 mb-4">
                        Current Plan
                      </Badge>
                    ) : p.highlight ? (
                      <Badge className="self-start bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">
                        Most Popular
                      </Badge>
                    ) : (
                      <div className="h-7 mb-4" />
                    )}

                    <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                    <div className="mt-3 mb-6">
                      <span className="text-4xl font-bold text-foreground">{p.price}</span>
                      <span className="text-muted-foreground text-sm">{p.period}</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button disabled className="w-full bg-secondary text-muted-foreground">
                        Current Plan
                      </Button>
                    ) : isLower ? (
                      <div className="h-10" />
                    ) : isUpgrade && priceId ? (
                      <Button
                        onClick={() => checkout.mutate(priceId)}
                        disabled={checkout.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {pending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Redirecting…
                          </>
                        ) : (
                          `Upgrade to ${p.name}`
                        )}
                      </Button>
                    ) : (
                      <Button disabled className="w-full bg-secondary text-muted-foreground">
                        Unavailable
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 mt-8">
          {planState !== 'starter' && (
            <Button
              variant="ghost"
              onClick={() => portal.mutate(undefined)}
              disabled={portal.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              {portal.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening…
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </>
              )}
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {planState === 'starter'
              ? 'Stripe Checkout will open in this window. You can cancel any time.'
              : 'Update payment method, change plan, or cancel in the billing portal.'}
          </p>
        </div>
      </div>
    </div>
  );
}
