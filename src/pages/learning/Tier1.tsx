import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierLessonList from '@/components/learning/TierLessonList';
import GraduationGateCard from '@/components/learning/GraduationGateCard';

export default function Tier1Learning() {
  const { isUnlocked } = useTier();

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
    <div className="max-w-5xl mx-auto space-y-6">
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
