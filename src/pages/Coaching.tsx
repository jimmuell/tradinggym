import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Brain, AlertTriangle, CheckCircle2, ChevronRight, MessageSquare, Calendar } from "lucide-react";
import HelpSheet from '@/components/HelpSheet';

const weeklyGoals = [
  { label: "Complete 5 simulator sessions", current: 3, target: 5, done: false },
  { label: "Maintain 55%+ win rate", current: 62, target: 55, done: true },
  { label: "Journal every session", current: 2, target: 5, done: false },
  { label: "Max 2% daily drawdown", current: 1.2, target: 2, done: true },
];

const coachingInsights = [
  { type: "strength" as const, icon: TrendingUp, title: "Strong entries on pullbacks", description: "Your pullback entries show a 68% win rate — keep leveraging this pattern." },
  { type: "improvement" as const, icon: AlertTriangle, title: "Holding losers too long", description: "Average losing trade duration is 3x your winners. Tighten stops or exit faster." },
  { type: "insight" as const, icon: Brain, title: "Best performance: 10–11 AM", description: "Your win rate peaks during the first hour after open. Consider focusing sessions here." },
];

const milestones = [
  { title: "First Trade", description: "Complete your first simulator trade", completed: true },
  { title: "10 Trade Streak", description: "Complete 10 trades in a single session", completed: true },
  { title: "Positive Week", description: "End a week with positive P&L", completed: false },
  { title: "Consistency Badge", description: "Trade 5 consecutive days", completed: false },
  { title: "Risk Master", description: "30 trades without exceeding max drawdown", completed: false },
];

function InsightIcon({ type }: { type: string }) {
  if (type === "strength") return <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="h-4 w-4 text-green-500" /></div>;
  if (type === "improvement") return <div className="p-2 rounded-lg bg-orange-500/10"><AlertTriangle className="h-4 w-4 text-orange-500" /></div>;
  return <div className="p-2 rounded-lg bg-primary/10"><Brain className="h-4 w-4 text-primary" /></div>;
}

export default function Coaching() {
  const goalsCompleted = weeklyGoals.filter(g => g.done).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coaching</h1>
          <p className="text-muted-foreground">Track goals, review insights, and build consistency.</p>
        </div>
        <HelpSheet pageName="Coaching" />
      </div>

      {/* Weekly Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Weekly Goals</span>
            <span className="text-sm text-muted-foreground">{goalsCompleted}/{weeklyGoals.length} completed</span>
          </div>
          <Progress value={(goalsCompleted / weeklyGoals.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-3">
          {weeklyGoals.map((goal, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {goal.done
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    : <Target className="h-5 w-5 text-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className={`text-sm font-medium ${goal.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{goal.label}</p>
                    {!goal.done && (
                      <p className="text-xs text-muted-foreground">{goal.current} / {goal.target}</p>
                    )}
                  </div>
                </div>
                {!goal.done && <Progress value={(goal.current / goal.target) * 100} className="w-20 h-2" />}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {coachingInsights.map((insight, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <InsightIcon type={insight.type} />
                <div>
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">AI coaching insights will become more personalized as you complete more sessions.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-3">
          {milestones.map((m, i) => (
            <Card key={i} className={!m.completed ? "opacity-60" : ""}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {m.completed
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </div>
                {m.completed && <Badge variant="default">Earned</Badge>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
