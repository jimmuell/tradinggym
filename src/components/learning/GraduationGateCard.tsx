import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, GraduationCap, ArrowRight } from 'lucide-react';
import { useTradeStats } from '@/hooks/useTradeStats';
import { usePromoteTier } from '@/hooks/usePromoteTier';
import { useTier, type TierState } from '@/contexts/TierContext';

interface GraduationGateCardProps {
  fromTier: 'tier1' | 'tier2' | 'tier3';
  targetTier: TierState | null; // null when terminal (tier3)
  requiredTrades: number;
  requiredWinRate: number;
  title: string;
  completionLabel: string;
  buttonLabel?: string;
}

export default function GraduationGateCard({
  fromTier,
  targetTier,
  requiredTrades,
  requiredWinRate,
  title,
  completionLabel,
  buttonLabel,
}: GraduationGateCardProps) {
  const { tradeCount, winRate, isLoading } = useTradeStats();
  const { currentTier, isUnlocked, loading: tierLoading } = useTier();
  const promote = usePromoteTier();

  const tierOrder: TierState[] = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];
  const alreadyAdvanced = targetTier
    ? tierOrder.indexOf(currentTier) >= tierOrder.indexOf(targetTier)
    : false;
  const terminalComplete =
    targetTier === null && isUnlocked('tier3') && tradeCount >= requiredTrades && winRate >= requiredWinRate;

  const tradesProgress = Math.min((tradeCount / requiredTrades) * 100, 100);
  const winRateProgress = Math.min((winRate / requiredWinRate) * 100, 100);
  const tradesMet = tradeCount >= requiredTrades;
  const winRateMet = winRate >= requiredWinRate;
  const canPromote = tradesMet && winRateMet && !alreadyAdvanced && targetTier !== null;

  // Guard: do not flash "not advanced yet" while plan/tier is still resolving.
  if (isLoading || tierLoading) {
    return <Skeleton className="h-56 w-full" />;
  }

  if (alreadyAdvanced || terminalComplete) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">{completionLabel}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-foreground/80">Simulator trades</span>
            <span className={`text-sm font-medium ${tradesMet ? 'text-green-500' : 'text-muted-foreground'}`}>
              {tradeCount} / {requiredTrades}
            </span>
          </div>
          <Progress value={tradesProgress} className="h-2" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-foreground/80">Win rate</span>
            <span className={`text-sm font-medium ${winRateMet ? 'text-green-500' : 'text-amber-500'}`}>
              {winRate}% / {requiredWinRate}%
            </span>
          </div>
          <Progress value={winRateProgress} className="h-2" />
        </div>

        {targetTier && (
          <Button
            size="sm"
            disabled={!canPromote || promote.isPending}
            onClick={() => promote.mutate(targetTier)}
          >
            {buttonLabel ?? `Advance to ${targetTier}`}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}

        {targetTier === null && (
          <p className="text-xs text-muted-foreground">
            Keep practicing in the simulator to reach mastery.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
