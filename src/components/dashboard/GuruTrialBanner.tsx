import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTier } from '@/contexts/TierContext';
import { useGuruProfile, useGuruApplication } from '@/hooks/useGuruData';

const STORAGE_KEY = 'guru_trial_dismissed';
const MAX_DISMISSALS = 3;

export function GuruTrialBanner() {
  const navigate = useNavigate();
  const { currentTier } = useTier();
  const { data: guruProfile, isLoading: loadingProfile } = useGuruProfile();
  const { data: guruApplication, isLoading: loadingApp } = useGuruApplication();
  const [dismissedCount, setDismissedCount] = useState(0);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    setDismissedCount(Number.isFinite(stored) ? stored : 0);
  }, []);

  // Map landing-page "Expert" → highest student tier in the DB.
  const isExpert = currentTier === 'tier3';

  if (loadingProfile || loadingApp) return null;
  if (!isExpert) return null;
  if (guruProfile) return null;
  if (guruApplication) return null;
  if (dismissedCount >= MAX_DISMISSALS) return null;

  const handleDismiss = () => {
    const next = dismissedCount + 1;
    localStorage.setItem(STORAGE_KEY, String(next));
    setDismissedCount(next);
  };

  const remaining = MAX_DISMISSALS - dismissedCount;

  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/10">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-amber-500" />
      <div className="flex flex-col gap-4 p-5 pl-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
            <GraduationCap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              You qualify for a free 30-day Guru Trial
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              TradingGYM Gurus run their coaching business inside the platform — classes,
              live sessions, student progress, and automated payouts. Expert members get 30
              days free.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Remind me later ({remaining}/{MAX_DISMISSALS})
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/guru/apply')}
            className="bg-amber-500 text-amber-950 hover:bg-amber-400"
          >
            Start My Free 30-Day Guru Trial
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GuruTrialBanner;
