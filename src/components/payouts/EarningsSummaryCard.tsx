import { Card, CardContent } from '@/components/ui/card';

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

export function EarningsSummaryCard() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Earnings" value="$0.00" />
        <Stat label="Active Referred Students" value="0" />
        <Stat label="Pending Payout" value="$0.00" />
      </div>
      <p className="text-sm text-muted-foreground">
        Earnings will appear here once students enroll using your referral link.
      </p>
    </div>
  );
}
