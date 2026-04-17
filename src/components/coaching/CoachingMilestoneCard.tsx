import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface CoachingMilestoneCardProps {
  title: string;
  description: string;
  completed: boolean;
}

export function CoachingMilestoneCard({ title, description, completed }: CoachingMilestoneCardProps) {
  return (
    <Card className={!completed ? 'opacity-60' : ''}>
      <CardContent className="pt-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {completed && <Badge variant="default">Earned</Badge>}
      </CardContent>
    </Card>
  );
}
