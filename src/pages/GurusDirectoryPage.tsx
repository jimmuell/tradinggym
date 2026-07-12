import { Link } from 'react-router-dom';
import PageSeo from '@/components/seo/PageSeo';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTier } from '@/contexts/TierContext';
import { usePublicGurus } from '@/hooks/usePublicGurus';
import { GuruCard } from '@/components/coaches/GuruCard';
import { GuruCardSkeleton } from '@/components/coaches/GuruCardSkeleton';

export default function GurusDirectoryPage() {
  const { planState, loading: tierLoading } = useTier();
  const { data: gurus, isLoading } = usePublicGurus();
  // Only show the "Upgrade to enroll" banner once we know the plan.
  const showStarterBanner = !tierLoading && planState === 'starter';

  return (
    <>
      <PageSeo
        title="Find a Trading Guru — TradingGYM Directory"
        description="Browse experienced trading educators on TradingGYM. Enroll in classes and get coached by independent Gurus to advance your trading."
        path="/gurus"
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Find a Guru</h1>
        <p className="text-muted-foreground mt-1">
          Connect with experienced traders who can guide your next phase.
        </p>
      </div>

      {showStarterBanner && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground">Upgrade to enroll with a Guru</div>
              <div className="text-sm text-muted-foreground">
                Browse profiles below — Pro or Expert subscription required to join a class.
              </div>
            </div>
            <Button asChild size="sm">
              <Link to="/pricing">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
          No Gurus available yet — check back soon.
        </div>
      )}
    </>
  );
}
