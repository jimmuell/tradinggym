import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface FeatureLockedScreenProps {
  featureName: string;
}

export default function FeatureLockedScreen({ featureName }: FeatureLockedScreenProps) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="text-center px-6">
        <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">{featureName} Locked</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Complete all 5 Foundation modules and pass the assessment to unlock {featureName}.
        </p>
        <Button asChild>
          <Link to="/learning/foundation">Go to Foundation</Link>
        </Button>
      </div>
    </div>
  );
}
