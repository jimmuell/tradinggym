import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierLessonList from '@/components/learning/TierLessonList';
import GraduationGateCard from '@/components/learning/GraduationGateCard';

export default function Tier3Learning() {
  const { isUnlocked } = useTier();

  if (!isUnlocked('tier3')) {
    return (
      <TierLockedState
        previousLevel="Tier 2"
        previousPath="/learning/tier2"
        subtext="Pass the Tier 2 graduation gate first."
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tier 3 — Institutional Concepts</h1>
        <p className="text-muted-foreground mt-1">
          Understand how institutions move price. AMD model and the Inverse Fair Value Gap.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1 italic">No Pain — No Gain</p>
      </div>

      <TierLessonList module="tier3_amd" basePath="/learning/tier3" />

      <GraduationGateCard
        fromTier="tier3"
        targetTier={null}
        requiredTrades={20}
        requiredWinRate={55}
        title="Tier 3 Mastery"
        completionLabel="Tier 3 Complete — You've mastered the TradingGYM curriculum."
      />
    </div>
  );
}
