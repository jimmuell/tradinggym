import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TierState } from '@/contexts/TierContext';

const BANNER_CONTENT: Record<TierState, { label?: string; heading: string; subtext: string; buttonText: string; link: string }> = {
  foundation: {
    label: 'YOUR LEARNING PATH',
    heading: 'Start your Starter training',
    subtext: 'Learn to read candles, market structure, sessions, and risk before your first trade.',
    buttonText: 'Start Starter',
    link: '/learning/foundation',
  },
  tier1: {
    heading: 'Continue Tier 1 — ORB Strategy',
    subtext: 'Keep practicing the 6-step ORB blueprint.',
    buttonText: 'Continue',
    link: '/learning/tier1',
  },
  tier2: {
    heading: 'Continue Tier 2 — ORB + VWAP',
    subtext: 'Apply the VWAP filter to your ORB setups.',
    buttonText: 'Continue',
    link: '/learning/tier2',
  },
  tier3: {
    heading: 'Continue Tier 3 — AMD Strategy',
    subtext: 'Practice the 7-step AMD blueprint.',
    buttonText: 'Continue',
    link: '/learning/tier3',
  },
  coach: {
    heading: 'Coach Dashboard',
    subtext: 'Manage your students and cohorts.',
    buttonText: 'Go to Coaching',
    link: '/coaching',
  },
};

export default function ContinueLearningBanner({ currentTier }: { currentTier: TierState }) {
  const navigate = useNavigate();
  const content = BANNER_CONTENT[currentTier];

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          {content.label && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{content.label}</p>
          )}
          <h3 className="text-lg font-semibold text-foreground">{content.heading}</h3>
          <p className="text-sm text-muted-foreground mt-1">{content.subtext}</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white shrink-0 ml-4"
          onClick={() => navigate(content.link)}
        >
          {content.buttonText}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
