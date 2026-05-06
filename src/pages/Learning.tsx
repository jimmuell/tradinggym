import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, BookOpen, ArrowRight, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { useTier, type TierState } from '@/contexts/TierContext';
import { useFoundationLessons } from '@/hooks/useLessons';
import { TIER_ORDER } from '@/lib/tierUtils';
import HelpSheet from '@/components/HelpSheet';
import LearningProgressCard from '@/components/dashboard/LearningProgressCard';

const TIERS = [
  {
    key: 'foundation' as TierState,
    title: 'Foundation — Trading Literacy',
    description: 'Learn to read candles, market structure, sessions, risk management, and build your trading plan.',
    modules: 'F1–F5 · 5 modules · Quiz assessment',
    path: '/learning/foundation',
    unlockRequirement: null,
  },
  {
    key: 'tier1' as TierState,
    title: 'Tier 1 — Pure Price Action (ORB)',
    description: 'Master the 6-step Opening Range Breakout blueprint using price action only. No indicators.',
    modules: '6-step ORB blueprint · 20 session graduation gate',
    path: '/learning/tier1',
    unlockRequirement: 'Complete Foundation',
  },
  {
    key: 'tier2' as TierState,
    title: 'Tier 2 — Confirmation Tools (ORB + VWAP)',
    description: 'Add VWAP as a directional filter to your ORB setups. Only trade in VWAP direction.',
    modules: 'VWAP filter strategy · 20 session graduation gate',
    path: '/learning/tier2',
    unlockRequirement: 'Complete Tier 1',
  },
  {
    key: 'tier3' as TierState,
    title: 'Tier 3 — Institutional Concepts (AMD + IFVG)',
    description: 'Learn the AMD model and Inverse Fair Value Gaps. ICT/Smart Money framework.',
    modules: '7-step AMD blueprint · 20 session graduation gate',
    path: '/learning/tier3',
    unlockRequirement: 'Complete Tier 2',
  },
];

export default function Learning() {
  const navigate = useNavigate();
  const { currentTier, planState, isUnlocked, loading: tierLoading } = useTier();
  const { data: foundationLessons, isLoading: lessonsLoading } = useFoundationLessons();

  const currentIdx = TIER_ORDER.indexOf(currentTier);
  const foundationModuleCount = foundationLessons
    ? new Set(foundationLessons.map((l) => l.module)).size
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Learning Hub
          </h1>
          <p className="text-muted-foreground">Your structured path from beginner to advanced trader.</p>
        </div>
        <HelpSheet pageName="Learning" />
      </div>

      {tierLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <LearningProgressCard currentTier={currentTier} planState={planState} />
      )}

      <div className="space-y-4">
        {TIERS.map((tier) => {
          const tierIdx = TIER_ORDER.indexOf(tier.key);
          const unlocked = isUnlocked(tier.key);
          const isCompleted = tierIdx < currentIdx;
          const isCurrent = tier.key === currentTier;
          const isLocked = !unlocked && !isCompleted;

          const modulesText =
            tier.key === 'foundation' && foundationModuleCount
              ? `F1–F${foundationModuleCount} · ${foundationModuleCount} modules · Quiz assessment`
              : tier.modules;

          const borderClass = isCompleted
            ? 'border-l-4 border-l-green-500'
            : isCurrent
            ? 'border-l-4 border-l-primary'
            : '';

          return (
            <Card
              key={tier.key}
              className={`${borderClass} ${isLocked ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{tier.title}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </div>
                  {isCompleted && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white border-green-600 shrink-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="shrink-0">In Progress</Badge>
                  )}
                  {isLocked && (
                    <Badge variant="outline" className="shrink-0">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked — {tier.unlockRequirement}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  {tier.key === 'foundation' && lessonsLoading ? (
                    <Skeleton className="h-4 w-64" />
                  ) : (
                    <p className="text-xs text-muted-foreground">{modulesText}</p>
                  )}
                  {isCompleted && (
                    <Button size="sm" variant="outline" onClick={() => navigate(tier.path)}>
                      Review
                    </Button>
                  )}
                  {isCurrent && (
                    <Button size="sm" onClick={() => navigate(tier.path)}>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                  {isLocked && (
                    <Button size="sm" variant="outline" disabled>
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => navigate('/resources')}
      >
        <CardContent className="pt-6 pb-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Resources</p>
            <p className="text-sm text-muted-foreground">
              Books, YouTube channels, tools, and communities curated for traders.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
