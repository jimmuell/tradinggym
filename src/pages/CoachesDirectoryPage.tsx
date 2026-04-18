import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTier } from '@/contexts/TierContext';
import { usePublicGurus } from '@/hooks/usePublicGurus';
import { GuruCard } from '@/components/coaches/GuruCard';
import { GuruCardSkeleton } from '@/components/coaches/GuruCardSkeleton';

export default function CoachesDirectoryPage() {
  const { currentTier } = useTier();
  const isLocked = currentTier === 'foundation';
  const { data: gurus, isLoading } = usePublicGurus();

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Find a Guru</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Complete Foundation to unlock Guru coaching.
        </p>
        <Button asChild>
          <Link to="/learning">Go to Foundation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Find a Guru</h1>
        <p className="text-muted-foreground mt-1">
          Connect with experienced traders who can guide your next phase.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GuruCardSkeleton />
          <GuruCardSkeleton />
          <GuruCardSkeleton />
        </div>
      ) : gurus && gurus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gurus.map((g) => (
            <GuruCard key={g.id} guru={g} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          No coaches available yet — check back soon.
        </div>
      )}
    </div>
  );
}
