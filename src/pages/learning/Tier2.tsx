import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierLessonList from '@/components/learning/TierLessonList';
import GraduationGateCard from '@/components/learning/GraduationGateCard';

export default function Tier2Learning() {
  const { isUnlocked, loading: tierLoading } = useTier();
  const navigate = useNavigate();

  if (tierLoading) {
    return <div className="min-h-[40vh]" aria-busy="true" />;
  }
  if (!isUnlocked('tier2')) {
    return (
      <TierLockedState
        previousLevel="Tier 1"
        previousPath="/learning/tier1"
        subtext="Pass the Tier 1 graduation gate first."
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
        <h1 className="text-2xl font-bold text-foreground">Tier 2 — Confirmation Tools</h1>
        <p className="text-muted-foreground mt-1">
          Add VWAP as a filter. Only trade in the direction of the market.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1 italic">No Pain — No Gain</p>
      </div>

      <TierLessonList module="tier2_vwap" basePath="/learning/tier2" />

      <GraduationGateCard
        fromTier="tier2"
        targetTier="tier3"
        requiredTrades={20}
        requiredWinRate={55}
        title="Tier 2 Graduation Gate"
        completionLabel="Tier 2 Complete — you've advanced to Tier 3."
        buttonLabel="Advance to Tier 3"
      />
    </div>
  );
}
