import GuruLayout from '@/layouts/GuruLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruProfile } from '@/hooks/useGuruData';
import { ReferralCodeCard } from '@/components/payouts/ReferralCodeCard';
import { EarningsSummaryCard } from '@/components/payouts/EarningsSummaryCard';
import { StripeConnectCard } from '@/components/payouts/StripeConnectCard';

export default function GuruPayoutsPage() {
  const { data: guru, isLoading } = useGuruProfile();

  return (
    <GuruLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your referral link, earnings, and payout method.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <ReferralCodeCard
              referralCode={
                (guru as { referral_code?: string | null } | null)
                  ?.referral_code ?? null
              }
            />
            <EarningsSummaryCard />
            <StripeConnectCard />
          </>
        )}
      </div>
    </GuruLayout>
  );
}
