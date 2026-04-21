import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function EnrollmentSuccessPage() {
  const [params] = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Edge function (until Prompt 3) emits cohort_id; accept either key for backwards compatibility
  const classId = params.get('class_id') ?? params.get('cohort_id');
  const sessionId = params.get('session_id');
  const isPlanUpgrade = !!sessionId && !classId;

  useEffect(() => {
    // Refresh profile so TierContext picks up new plan_state
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    const t = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(t);
  }, [queryClient, user?.id]);

  if (!showContent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground">
            {isPlanUpgrade ? 'Activating your new plan…' : 'Confirming your enrollment…'}
          </p>
        </div>
      </div>
    );
  }

  if (isPlanUpgrade) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">You're upgraded!</h1>
            <p className="text-muted-foreground">
              Your new plan is now active. All features are unlocked.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-14 w-14 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">You're enrolled!</h1>
          <p className="text-muted-foreground">
            Your Guru access is ready. Click below to go to your class.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild>
              <Link to={classId ? `/classes/${classId}` : '/classes'}>
                Go to My Classes
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
