import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierLessonList from '@/components/learning/TierLessonList';
import GraduationGateCard from '@/components/learning/GraduationGateCard';
import { useLessonsByModule } from '@/hooks/useLessons';
import { useCompletedLessonIds } from '@/hooks/useLessonProgress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useGuidedOrbScenarioId() {
  return useQuery({
    queryKey: ['playback_scenario', 'guided-orb'],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('strategy_playback_scenarios' as any)
        .select('id, indicator_tags, is_active')
        .eq('is_active', true)
        .contains('indicator_tags', ['guided'])
        .limit(1);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data ?? []) as any[];
      return rows[0]?.id ?? null;
    },
  });
}

export default function Tier1Learning() {
  const { isUnlocked } = useTier();
  const navigate = useNavigate();
  const { data: lessons } = useLessonsByModule('tier1_orb');
  const { data: orbId } = useGuidedOrbScenarioId();
  const { data: completedIds, isLoading: progressLoading } = useCompletedLessonIds();

  if (!isUnlocked('tier1')) {
    return (
      <TierLockedState
        previousLevel="Foundation"
        previousPath="/learning/foundation"
        subtext="Complete Foundation and pass the quiz first."
      />
    );
  }

  const lessonIds = (lessons ?? []).map((l) => l.id);
  const completed = completedIds ?? [];
  const allComplete =
    !progressLoading &&
    lessonIds.length > 0 &&
    lessonIds.every((id) => completed.includes(id));

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
        <h1 className="text-2xl font-bold text-foreground">Price Action — Pure Price Action</h1>
        <p className="text-muted-foreground mt-1">
          Master the ORB strategy using price action only. No indicators.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1 italic">No Pain — No Gain</p>
      </div>

      <TierLessonList module="tier1_orb" basePath="/learning/tier1" />

      {orbId && (
        <Card className={allComplete ? 'border-primary/40' : 'opacity-75'}>
          <CardHeader>
            <CardTitle className="text-lg">Ready to trade it?</CardTitle>
            <CardDescription>
              {allComplete
                ? 'Watch the ORB blueprint play out, then try it yourself on the simulator.'
                : 'Finish all 3 Price Action lessons to unlock the guided walkthrough.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button
              disabled={!allComplete}
              onClick={() => navigate(`/simulator?playback=${orbId}`)}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Show me the ORB
            </Button>
            <Button
              variant="secondary"
              disabled={!allComplete}
              onClick={() => navigate(`/simulator?playback=${orbId}&practice=1`)}
              className="gap-2"
            >
              <Hand className="h-4 w-4" />
              Now you try
            </Button>
          </CardContent>
        </Card>
      )}

      <GraduationGateCard
        fromTier="tier1"
        targetTier="tier2"
        requiredTrades={20}
        requiredWinRate={50}
        title="Price Action Graduation Gate"
        completionLabel="Price Action Complete — you've advanced to Confirmation."
        buttonLabel="Advance to Confirmation"
      />
    </div>
  );
}
