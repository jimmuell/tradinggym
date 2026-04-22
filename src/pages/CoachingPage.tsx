import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoaching } from '@/hooks/useCoaching';
import { CoachingGoalCard } from '@/components/coaching/CoachingGoalCard';
import { CoachingInsightCard } from '@/components/coaching/CoachingInsightCard';
import { CoachingMilestoneCard } from '@/components/coaching/CoachingMilestoneCard';

export default function CoachingPage() {
  const c = useCoaching();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Coaching</h1>
        <p className="text-muted-foreground mt-1">
          Track your goals, review insights, and celebrate milestones.
        </p>
      </header>

      {c.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="goals" className="w-full">
          <TabsList>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-3 mt-4">
            <CoachingGoalCard
              label="Practice 5 days this week"
              current={c.sessionsThisWeek}
              target={5}
              done={c.sessionsThisWeek >= 5}
            />
            <CoachingGoalCard
              label="Maintain 55%+ win rate"
              current={c.winRateThisWeek}
              target={55}
              done={c.winRateThisWeek >= 55}
              displayCurrent={`${c.winRateThisWeek.toFixed(1)}%`}
            />
            <CoachingGoalCard
              label="Keep daily drawdown under 2%"
              current={c.maxDailyDrawdownThisWeek}
              target={2}
              done={c.maxDailyDrawdownThisWeek < 2}
              displayCurrent={`${c.maxDailyDrawdownThisWeek.toFixed(2)}%`}
              inverse
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-3 mt-4">
            <CoachingInsightCard
              type={c.winRate >= 50 ? 'strength' : 'improvement'}
              title="Win Rate"
              body={`Your overall win rate is ${c.winRate.toFixed(1)}%.`}
            />
            <CoachingInsightCard
              type={c.avgStepAccuracy >= 70 ? 'strength' : 'improvement'}
              title="Blueprint Accuracy"
              body={`Your average blueprint step accuracy is ${c.avgStepAccuracy.toFixed(0)}%.`}
            />
            <CoachingInsightCard
              type="insight"
              title="Best Trading Hour"
              body={
                c.bestHour !== null
                  ? `Your best hour is ${c.bestHour}:00`
                  : 'Trade more to discover your best hour'
              }
            />
            <CoachingInsightCard
              type="insight"
              title="Risk Profile"
              body={`Avg winner: $${c.avgWinningPnl.toFixed(2)}, Avg loser: $${c.avgLosingPnl.toFixed(2)}`}
            />
            <CoachingInsightCard
              type={c.longestWinStreak >= 3 ? 'strength' : 'insight'}
              title="Win Streak"
              body={`Longest win streak: ${c.longestWinStreak} trades`}
            />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-3 mt-4">
            <CoachingMilestoneCard
              title="First Trade"
              description="Place your first simulator trade"
              completed={c.hasFirstTrade}
            />
            <CoachingMilestoneCard
              title="Marathon Session"
              description="Complete 10+ trades in a single day"
              completed={c.hasTenTradeSession}
            />
            <CoachingMilestoneCard
              title="Profitable Week"
              description="Finish a week with positive P&L"
              completed={c.hasPositiveWeek}
            />
            <CoachingMilestoneCard
              title="5-Day Streak"
              description="Trade on 5 consecutive calendar days"
              completed={c.hasConsecutiveDays}
            />
            <CoachingMilestoneCard
              title="Risk Master"
              description="30 consecutive trades with max loss under $50"
              completed={c.hasRiskMaster}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
