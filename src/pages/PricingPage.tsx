import { ArrowLeft, Check, ExternalLink, Loader2, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  guru: 'price_1TNuSfLMQSLv70CqAGpPSnnU',
};

const GURU_PRICE_ID = PLAN_PRICE_MAP.guru;

const PLAN_RANK: Record<PlanState, number> = {
  starter: 0,
  pro: 1,
  expert: 2,
  guru: 3,
  admin: 99,
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
    name: 'Free',
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
      'Everything in Free',
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
  {
    key: 'guru',
    name: 'Guru',
    price: '$99',
    period: '/mo',
    highlight: false,
    features: [
      'Everything in Expert',
      'Guru dashboard & class management',
      'Publish educational content',
      'Student progress tracking',
      'Live session broadcasting',
      'Stripe Connect payouts',
      'Keep 80% of student revenue',
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { planState, loading } = useTier();
  const checkout = useCreateCheckout();
  const portal = useCustomerPortal();
  const [searchParams] = useSearchParams();
  const highlightPlan = searchParams.get('highlight') as PlanState | null;

  const currentRank = PLAN_RANK[planState] ?? 0;

  return (
    <>
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 -ml-2 mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upgrade to unlock advanced features and accelerate your trading.
          </p>
        </div>

        {highlightPlan && planState === 'starter' && (
          <div className="mb-8 max-w-3xl mx-auto rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              You selected the <span className="font-semibold capitalize">{highlightPlan}</span> plan.
              Click the upgrade button below to subscribe.
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[480px] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((p) => {
              const isGuru = p.key === 'guru';
              const isCurrent = p.key === planState;
              const isLower = PLAN_RANK[p.key] < currentRank;
              const isUpgrade = PLAN_RANK[p.key] > currentRank;
              const isHighlighted = highlightPlan === p.key && planState === 'starter';
              const priceId = PLAN_PRICE_MAP[p.key];
              const pending = checkout.isPending && checkout.variables === priceId;

              return (
                <Card
                  key={p.key}
                  className={`bg-card border transition-all ${
                    isCurrent
                      ? 'border-green-500/50 shadow-lg shadow-green-500/10'
                      : isHighlighted
                      ? `${isGuru ? 'border-amber-500/60 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30' : 'border-blue-500/60 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30'}`
                      : isGuru
                      ? 'border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : p.highlight
                      ? 'border-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'border-border'
                  }`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    {isCurrent ? (
                      <Badge className="self-start bg-green-500/10 text-green-500 border-green-500/20 mb-4">
                        Current Plan
                      </Badge>
                    ) : isGuru ? (
                      <Badge className="self-start bg-amber-500/10 text-amber-400 border-amber-500/20 mb-4">
                        For Educators
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

                    <ul className="space-y-2 mb-6 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isGuru ? 'text-amber-400' : 'text-blue-400'}`} />
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
                        className={`w-full ${isGuru ? 'bg-amber-500 hover:bg-amber-600 text-amber-950' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
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
    </>
  );
}
