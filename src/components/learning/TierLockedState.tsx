import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TierLockedStateProps {
  previousLevel: string;
  previousPath: string;
  subtext: string;
}

export default function TierLockedState({ previousLevel, previousPath, subtext }: TierLockedStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <Lock className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Complete {previousLevel} to unlock this tier
      </h1>
      <p className="text-muted-foreground mb-6">{subtext}</p>
      <Button onClick={() => navigate(previousPath)}>
        Go to {previousLevel}
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
