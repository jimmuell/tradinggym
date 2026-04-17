import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, MessageSquare } from 'lucide-react';
import HelpSheet from '@/components/HelpSheet';
import { useCoaching } from '@/hooks/useCoaching';
import { CoachingGoalCard } from '@/components/coaching/CoachingGoalCard';
import { CoachingInsightCard, InsightType } from '@/components/coaching/CoachingInsightCard';
import { CoachingMilestoneCard } from '@/components/coaching/CoachingMilestoneCard';

export default function Coaching() {
  const c = useCoaching();

  const goals = [
    {
      label: 'Complete 5 simulator sessions',
      current: c.sessionsThisWeek,
      target: 5,
      done: c.sessionsThisWeek >= 5,
    },
    {
      label: 'Maintain 55%+ win rate',
      current: c.winRateThisWeek,
      target: 55,
      done: c.winRateThisWeek >= 55,
      displayCurrent: `${c.winRateThisWeek.toFixed(0)}%`,
    },
    {
      label: 'Journal every session',
      current: c.journalEntriesThisWeek,
      target: 5,
      done: c.journalEntriesThisWeek >= 5,
    },
    {
      label: 'Stay under 2% daily drawdown',
      current: c.maxDailyDrawdownThisWeek,
      target: 2,
      done: c.maxDailyDrawdownThisWeek <= 2,
      displayCurrent: `${c.maxDailyDrawdownThisWeek.toFixed(1)}%`,
      inverse: true,
    },
  ];
  const goalsCompleted = goals.filter((g) => g.done).length;

  const insights: { type: InsightType; title: string; body: string }[] = [];
  if (c.totalTrades >= 5) {
    insights.push(
      c.winRate >= 55
        ? {
            type: 'strength',
            title: `Win rate: ${c.winRate.toFixed(0)}%`,
            body: "You're winning more than you're losing — keep executing your process.",
          }
        : {
            type: 'improvement',
            title: `Win rate: ${c.winRate.toFixed(0)}%`,
            body: 'Your win rate is below 55%. Focus on setup quality over trade frequency.',
          },
    );
    insights.push(
      c.avgStepAccuracy >= 70
        ? {
            type: 'strength',
            title: `Blueprint accuracy: ${c.avgStepAccuracy.toFixed(0)}%`,
            body: "You're following your trading plan consistently. Discipline is your edge.",
          }
        : {
            type: 'improvement',
            title: `Blueprint accuracy: ${c.avgStepAccuracy.toFixed(0)}%`,
            body: "You're skipping steps in your blueprint. Slow down and follow each step before entry.",
          },
    );
  }
  if (c.bestHour !== null) {
    insights.push({
      type: 'insight',
      title: `Peak performance: ${c.bestHour}:00–${c.bestHour + 1}:00`,
      body: 'Your win rate is highest during this hour. Consider focusing your sessions here.',
    });
  }
  if (c.totalTrades >= 10) {
    const lossExceeds = Math.abs(c.avgLosingPnl) > c.avgWinningPnl;
    insights.push(
      lossExceeds
        ? {
            type: 'improvement',
            title: 'Losers exceed winners',
            body: `Your average loss ($${Math.abs(c.avgLosingPnl).toFixed(2)}) is larger than your average win ($${c.avgWinningPnl.toFixed(2)}). Tighten stops or take profit sooner.`,
          }
        : {
            type: 'strength',
            title: 'Good risk/reward ratio',
            body: 'Your average winner exceeds your average loser. Your risk/reward is working.',
          },
    );
  }
  if (c.longestWinStreak >= 3) {
    insights.push({
      type: 'strength',
      title: `Best win streak: ${c.longestWinStreak} trades`,
      body: "You've shown you can string wins together. Focus on repeating the same process each time.",
    });
  }

  const milestones = [
    { title: 'First Trade', description: 'Complete your first simulator trade', completed: c.hasFirstTrade },
    { title: '10-Trade Session', description: 'Complete 10 trades in a single day', completed: c.hasTenTradeSession },
    { title: 'Positive Week', description: 'End a calendar week with positive P&L', completed: c.hasPositiveWeek },
    { title: 'Consistency Badge', description: 'Trade 5 consecutive days', completed: c.hasConsecutiveDays },
    { title: 'Risk Master', description: '30 trades without a large loss (>$50)', completed: c.hasRiskMaster },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coaching</h1>
          <p className="text-muted-foreground">
            Your personal trading coach — goals, milestones, and performance insights based on your real session data.
          </p>
        </div>
        <HelpSheet pageName="Coaching" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Weekly Goals</span>
            <span className="text-sm text-muted-foreground">{goalsCompleted}/4 goals this week</span>
          </div>
          <Progress value={(goalsCompleted / 4) * 100} className="h-2" />
        </CardContent>
      </Card>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-3">
          {c.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : c.totalTrades === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-3">
                <Target className="h-10 w-10 text-muted-foreground" />
                <p className="text-base font-medium text-foreground">No sessions yet this week</p>
                <p className="text-sm text-muted-foreground">
                  Complete your first simulator trade to start tracking your weekly goals.
                </p>
              </CardContent>
            </Card>
          ) : (
            goals.map((g, i) => <CoachingGoalCard key={i} {...g} />)
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {c.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : c.totalTrades < 5 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Complete at least 5 simulator sessions to unlock personalized coaching insights.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {insights.map((ins, i) => (
                <CoachingInsightCard key={i} {...ins} />
              ))}
              <Card className="border-dashed">
                <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-2">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Insights update automatically as you complete more sessions.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-3">
          {c.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            : milestones.map((m, i) => <CoachingMilestoneCard key={i} {...m} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
