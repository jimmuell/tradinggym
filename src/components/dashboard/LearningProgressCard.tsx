import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TierState } from '@/contexts/TierContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getTierDisplayName } from '@/lib/tierUtils';
import { toast } from 'sonner';

interface LearningProgressCardProps {
  currentTier: TierState;
  planState: string;
}

const BANNER_CONTENT: Record<TierState, { label?: string; heading: string; subtext: string; buttonText: string; link: string }> = {
  foundation: {
    label: 'YOUR LEARNING PATH',
    heading: 'Begin Your Trading Foundation',
    subtext: 'Learn to read candles, market structure, sessions, and risk before your first trade.',
    buttonText: 'Start Learning',
    link: '/learning/foundation',
  },
  tier1: {
    heading: 'Continue Price Action — ORB Strategy',
    subtext: 'Keep practicing the 6-step ORB blueprint.',
    buttonText: 'Continue',
    link: '/learning/tier1',
  },
  tier2: {
    heading: 'Continue Confirmation — ORB + VWAP',
    subtext: 'Apply the VWAP filter to your ORB setups.',
    buttonText: 'Continue',
    link: '/learning/tier2',
  },
  tier3: {
    heading: 'Continue Institutional — AMD Strategy',
    subtext: 'Practice the 7-step AMD blueprint.',
    buttonText: 'Continue',
    link: '/learning/tier3',
  },
  coach: {
    heading: 'Guru Dashboard',
    subtext: 'Manage your students and classes.',
    buttonText: 'Go to Classes',
    link: '/classes',
  },
};

const TIERS: { key: TierState; path: string }[] = [
  { key: 'foundation', path: '/learning/foundation' },
  { key: 'tier1', path: '/learning/tier1' },
  { key: 'tier2', path: '/learning/tier2' },
  { key: 'tier3', path: '/learning/tier3' },
];

const TIER_ORDER: TierState[] = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];
const tierIndex = (t: TierState) => TIER_ORDER.indexOf(t);

export default function LearningProgressCard({ currentTier, planState }: LearningProgressCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showBadges = planState !== 'starter' && currentTier !== 'coach';

  const { data: foundationLessons } = useFoundationLessons();

  const { data: completedLessonIds = [] } = useQuery({
    queryKey: ['completed-lessons-local'],
    queryFn: () => {
      try {
        const raw = localStorage.getItem('completedLessons');
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        return [];
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const foundationCompletedCount =
    foundationLessons?.filter((l) => completedLessonIds.includes(l.id)).length ?? 0;
  const foundationTotal = foundationLessons?.length ?? 5;
  const hasStarted = foundationCompletedCount > 0;

  const content =
    currentTier === 'foundation' && hasStarted
      ? {
          label: 'YOUR LEARNING PATH',
          heading: 'Continue Your Foundation',
          subtext: 'Pick up where you left off — keep building your trading knowledge.',
          buttonText: 'Continue',
          link: '/learning/foundation',
        }
      : BANNER_CONTENT[currentTier];

  const profileLoading = false;

  const progressPct = (() => {
    if (currentTier === 'coach') return 100;
    if (currentTier === 'foundation') {
      return Math.min(100, Math.round((foundationCompletedCount / Math.max(1, foundationTotal)) * 100));
    }
    if (currentTier === 'tier1') return 25;
    if (currentTier === 'tier2') return 50;
    if (currentTier === 'tier3') return 75;
    return 0;
  })();

  const currentIdx = tierIndex(currentTier);

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {content.label && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{content.label}</p>
            )}
            <h3 className="text-lg font-semibold text-foreground">{content.heading}</h3>
            <p className="text-sm text-muted-foreground mt-1">{content.subtext}</p>
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
            onClick={() => navigate(content.link)}
          >
            {content.buttonText}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {showBadges && (
          <div className="mt-5 pt-5 border-t border-border">
            {profileLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  {TIERS.map((tier, i) => {
                    const idx = tierIndex(tier.key);
                    const isCompleted = idx < currentIdx;
                    const isCurrent = tier.key === currentTier;
                    const isLocked = !isCompleted && !isCurrent;

                    return (
                      <div key={tier.key} className="flex items-center gap-2">
                        <Badge
                          className={`cursor-pointer select-none ${
                            isCompleted
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                              : isCurrent
                              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                              : 'bg-transparent border-muted-foreground/30 text-muted-foreground'
                          }`}
                          variant={isLocked ? 'outline' : 'default'}
                          onClick={() => {
                            if (isLocked) {
                              const prev = TIERS[idx - 1];
                              toast(`Complete ${prev ? getTierDisplayName(prev.key) : 'previous tier'} to unlock`);
                            } else {
                              navigate(tier.path);
                            }
                          }}
                        >
                          {isCompleted && <Check className="h-3 w-3 mr-1" />}
                          {getTierDisplayName(tier.key)}
                          {isLocked && <Lock className="h-3 w-3 ml-1" />}
                        </Badge>
                        {i < TIERS.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <Progress value={progressPct} className="mt-4 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {progressPct}% complete
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
