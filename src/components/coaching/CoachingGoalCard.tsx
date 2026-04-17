import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Target } from 'lucide-react';

interface CoachingGoalCardProps {
  label: string;
  current: number;
  target: number;
  done: boolean;
  displayCurrent?: string;
  inverse?: boolean; // for drawdown: lower is better
}

export function CoachingGoalCard({ label, current, target, done, displayCurrent, inverse }: CoachingGoalCardProps) {
  const pct = inverse
    ? Math.max(0, Math.min(100, 100 - (current / target) * 100))
    : Math.max(0, Math.min(100, (current / target) * 100));

  return (
    <Card>
      <CardContent className="pt-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <Target className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {label}
            </p>
            {!done && (
              <p className="text-xs text-muted-foreground">
                {displayCurrent ?? current} / {target}
              </p>
            )}
          </div>
        </div>
        {!done && <Progress value={pct} className="w-20 h-2" />}
      </CardContent>
    </Card>
  );
}
