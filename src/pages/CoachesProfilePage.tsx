import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { useEnrollWithGuru } from '@/hooks/useEnrollWithGuru';
import { usePublicGuru } from '@/hooks/usePublicGurus';
import { getTierDisplayName } from '@/lib/tierUtils';

export default function CoachesProfilePage() {
  const { guruId } = useParams<{ guruId: string }>();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') ?? undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTier } = useTier();
  const { data: guru, isLoading } = usePublicGuru(guruId);
  const enroll = useEnrollWithGuru();

  const isFoundation = currentTier === 'foundation';
  const isAuthed = !!user;

  const handleJoin = () => {
    if (!guruId) return;
    enroll.mutate(
      { guruId, referralCode },
      {
        onSuccess: (result) => {
          toast({
            title: 'Welcome to the cohort!',
            description: result.enrollment_type === 'referred'
              ? 'First month free credit applied.'
              : 'Your enrollment is confirmed.',
          });
          navigate(`/checkout/success?cohort_id=${result.cohort_id}`);
        },
        onError: (err) => {
          toast({
            title: 'Could not enroll',
            description: err.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!guru) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Coach not found</h1>
        <p className="text-muted-foreground mb-6">
          This profile is unavailable or no longer public.
        </p>
        <Button asChild variant="outline">
          <Link to="/coaches">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Coaches
          </Link>
        </Button>
      </div>
    );
  }

  const initials = (guru.display_name ?? '?').trim().charAt(0).toUpperCase();
  const showFreeMonth = guru.referral_discount_pct === 100 && !!guru.referral_code;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/coaches">
          <ArrowLeft className="h-4 w-4 mr-2" />
          All coaches
        </Link>
      </Button>

      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
        <Avatar className="h-24 w-24 shrink-0">
          {guru.avatar_url && <AvatarImage src={guru.avatar_url} alt={guru.display_name ?? 'Coach'} />}
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground">
            {guru.display_name ?? 'Unnamed Coach'}
          </h1>
          {guru.tagline && (
            <p className="text-muted-foreground mt-1">{guru.tagline}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {guru.primary_instrument && (
              <Badge variant="secondary">{guru.primary_instrument}</Badge>
            )}
            {guru.primary_strategy && (
              <Badge variant="secondary">{guru.primary_strategy}</Badge>
            )}
          </div>
        </div>
      </div>

      {showFreeMonth && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="font-semibold text-foreground">First month free</div>
              <div className="text-sm text-muted-foreground">
                Use referral code <span className="font-mono">{guru.referral_code}</span> at checkout.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bio */}
      {guru.bio && guru.bio.trim().length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{guru.bio}</p>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Win Rate" value={guru.win_rate !== null ? `${guru.win_rate}%` : '—'} />
        <StatCard label="Total Trades" value={guru.total_trades.toLocaleString()} />
        <StatCard label="Active Students" value={guru.active_students.toLocaleString()} />
        <StatCard
          label="TradingGYM Tier"
          value={guru.tier_state ? getTierDisplayName(guru.tier_state) : '—'}
        />
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        {!isAuthed ? (
          <Button asChild size="lg">
            <Link to="/auth">Sign in to join</Link>
          </Button>
        ) : isFoundation ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="lg" disabled>
                    Join Cohort
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Complete Foundation to enroll with a Coach.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button size="lg" onClick={handleJoin} disabled={enroll.isPending}>
            {enroll.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enrolling…
              </>
            ) : (
              'Join Cohort'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
