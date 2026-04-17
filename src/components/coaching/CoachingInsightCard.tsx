import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, Brain } from 'lucide-react';

export type InsightType = 'strength' | 'improvement' | 'insight';

interface CoachingInsightCardProps {
  type: InsightType;
  title: string;
  body: string;
}

function InsightIcon({ type }: { type: InsightType }) {
  if (type === 'strength')
    return (
      <div className="p-2 rounded-lg bg-green-500/10">
        <TrendingUp className="h-4 w-4 text-green-500" />
      </div>
    );
  if (type === 'improvement')
    return (
      <div className="p-2 rounded-lg bg-orange-500/10">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
      </div>
    );
  return (
    <div className="p-2 rounded-lg bg-primary/10">
      <Brain className="h-4 w-4 text-primary" />
    </div>
  );
}

export function CoachingInsightCard({ type, title, body }: CoachingInsightCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 flex items-start gap-3">
        <InsightIcon type={type} />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
