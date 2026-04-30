import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierLessonList from '@/components/learning/TierLessonList';
import GraduationGateCard from '@/components/learning/GraduationGateCard';

export default function Tier1Learning() {
  const { isUnlocked } = useTier();
  const navigate = useNavigate();

  if (!isUnlocked('tier1')) {
    return (
      <TierLockedState
        previousLevel="Starter"
        previousPath="/learning/foundation"
        subtext="Complete Starter and pass the quiz first."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2"
        onClick={() => navigate('/learning')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Learning Hub
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tier 1 — Pure Price Action</h1>
        <p className="text-muted-foreground mt-1">
          Master the ORB strategy using price action only. No indicators.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1 italic">No Pain — No Gain</p>
      </div>

      <TierLessonList module="tier1_orb" basePath="/learning/tier1" />

      <GraduationGateCard
        fromTier="tier1"
        targetTier="tier2"
        requiredTrades={20}
        requiredWinRate={50}
        title="Tier 1 Graduation Gate"
        completionLabel="Tier 1 Complete — you've advanced to Tier 2."
        buttonLabel="Advance to Tier 2"
      />
    </div>
  );
}
