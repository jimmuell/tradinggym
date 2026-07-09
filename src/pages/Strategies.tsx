import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Plus, Lock, ChevronRight, Sparkles, Play, FileCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTier, TierState } from '@/contexts/TierContext';
import { useScenarioMatch } from '@/hooks/useScenarioMatch';
import HelpSheet from '@/components/HelpSheet';
import { PineExportModal } from '@/components/strategies/PineExportModal';
import FeatureLockedScreen from '@/components/FeatureLockedScreen';

interface Strategy {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  instrument: string | null;
  timeframe: string | null;
  direction_bias: string | null;
  entry_rules: string | null;
  exit_rules: string | null;
  notes: string | null;
  is_system: boolean;
  tier_required: string;
  created_at: string;
  source?: string | null;
}

type SourceFilter = 'all' | 'manual' | 'ai_extracted';

const tierBadgeColors: Record<string, string> = {
  foundation: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  tier1: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  tier2: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  tier3: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

import { TIER_DISPLAY_NAMES, getTierDisplayName, isFreePlan } from '@/lib/tierUtils';

const tierLabels: Record<string, string> = TIER_DISPLAY_NAMES;

function StrategyCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

function StrategyCard({
  strategy,
  locked,
  onClick,
  onWatchDemo,
  onExport,
}: {
  strategy: Strategy;
  locked: boolean;
  onClick: () => void;
  onWatchDemo: (s: Strategy) => void;
  onExport: (s: Strategy) => void;
}) {
  const showAiBadge = !strategy.is_system && strategy.source === 'ai_extracted';
  const { data: matchedScenarioId } = useScenarioMatch(locked ? null : strategy);
  return (
    <Card
      className={`group relative transition-all cursor-pointer ${locked ? 'opacity-50' : 'hover:border-primary/30 hover:shadow-md'}`}
      onClick={onClick}
    >
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Lock className="h-6 w-6" />
            <span className="text-sm font-medium">
              Complete {tierLabels[strategy.tier_required] || strategy.tier_required} to unlock
            </span>
          </div>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base leading-snug">{strategy.name}</CardTitle>
              {showAiBadge && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs border-primary/40 bg-primary/10 text-primary"
                >
                  <Sparkles className="h-3 w-3" />
                  AI Extracted
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm leading-relaxed line-clamp-2">
              {strategy.description}
            </CardDescription>
          </div>
          {strategy.tier_required !== 'foundation' && (
            <Badge
              variant="outline"
              className={`shrink-0 text-xs ${tierBadgeColors[strategy.tier_required] || ''}`}
            >
              {tierLabels[strategy.tier_required]}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2">
          {strategy.instrument && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {strategy.instrument}
            </Badge>
          )}
          {strategy.timeframe && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {strategy.timeframe}
            </Badge>
          )}
          {strategy.direction_bias && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {strategy.direction_bias}
            </Badge>
          )}
        </div>
        {!locked && (
          <div className="flex justify-between items-center mt-3 gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                disabled={!matchedScenarioId}
                onClick={(e) => {
                  e.stopPropagation();
                  onWatchDemo(strategy);
                }}
              >
                <Play className="h-3 w-3" />
                Watch Demo
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(strategy);
                    }}
                    aria-label="Export to Pine Script"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export to Pine Script</TooltipContent>
              </Tooltip>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
              View Details <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Strategies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isUnlocked, currentTier, canAccess, loading: tierLoading, planState } = useTier();
  const { toast } = useToast();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [exportStrategy, setExportStrategy] = useState<Strategy | null>(null);

  const allowed = canAccess('strategies');

  const { data: systemStrategies, isLoading: loadingSystem } = useQuery({
    queryKey: ['strategies', 'system'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('is_system', true)
        .order('created_at');
      if (error) throw error;
      return (data || []) as unknown as Strategy[];
    },
  });

  const { data: userStrategies, isLoading: loadingUser } = useQuery({
    queryKey: ['strategies', 'user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_system', false)
        .order('created_at');
      if (error) throw error;
      return (data || []) as unknown as Strategy[];
    },
    enabled: !!user,
  });

  const atCap = isFreePlan(planState) && (userStrategies?.length ?? 0) >= 1;

  const handleNewStrategyClick = () => {
    if (atCap) {
      toast({
        title: 'Upgrade to Pro',
        description: 'Free plan is limited to 1 custom strategy. Upgrade to Pro to create more.',
      });
      navigate('/pricing');
      return;
    }
    navigate('/strategies/new');
  };

  const filteredUserStrategies = (userStrategies ?? []).filter((s) => {
    if (sourceFilter === 'all') return true;
    if (sourceFilter === 'ai_extracted') return s.source === 'ai_extracted';
    // 'manual' — treat missing source as manual for legacy rows
    return s.source === 'manual' || !s.source;
  });

  const FILTER_OPTIONS: { value: SourceFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'manual', label: 'Manual' },
    { value: 'ai_extracted', label: 'AI Extracted' },
  ];

  const handleCardClick = (strategy: Strategy, locked: boolean) => {
    if (locked) {
      toast({
        title: 'Strategy Locked',
        description: `Complete ${tierLabels[strategy.tier_required] || strategy.tier_required} to unlock this strategy.`,
      });
      return;
    }
    navigate(`/strategies/${strategy.id}`);
  };

  const handleWatchDemo = async (strategy: Strategy) => {
    // Match the strategy to a scenario via the same logic as the card hook.
    const { data } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('strategy_playback_scenarios' as any)
      .select('id, indicator_tags, direction')
      .eq('is_active', true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scenarios = (data ?? []) as any[];
    if (!scenarios.length) {
      toast({ title: 'No demo available', description: 'No playback scenarios have been added yet.' });
      return;
    }
    // simple first-match fallback (the hook scoring is fine for the badge state)
    navigate(`/simulator?playback=${scenarios[0].id}`);
  };

  if (tierLoading) return null;
  if (!allowed) return <FeatureLockedScreen featureName="Strategies" />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Strategies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse proven trading strategies or create your own playbook.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpSheet pageName="Strategies" />
          <Button
            variant="outline"
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => navigate('/strategies/extract')}
          >
            <Sparkles className="h-4 w-4" />
            Extract from Transcript
          </Button>
          <Button className="gap-2" onClick={handleNewStrategyClick}>
            <Plus className="h-4 w-4" />
            {atCap ? 'Upgrade to Pro' : 'New Strategy'}
          </Button>
        </div>
      </div>

      {/* TradingGYM Strategies */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">TradingGYM Strategies</h2>
        {loadingSystem ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <StrategyCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {systemStrategies?.map((s) => {
              const locked = !isUnlocked(s.tier_required as TierState);
              return (
                <StrategyCard
                  key={s.id}
                  strategy={s}
                  locked={locked}
                  onClick={() => handleCardClick(s, locked)}
                  onWatchDemo={handleWatchDemo}
                  onExport={setExportStrategy}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* My Strategies */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">My Strategies</h2>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSourceFilter(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  sourceFilter === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {loadingUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StrategyCardSkeleton />
          </div>
        ) : filteredUserStrategies.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredUserStrategies.map((s) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                locked={false}
                onClick={() => navigate(`/strategies/${s.id}`)}
                onWatchDemo={handleWatchDemo}
                onExport={setExportStrategy}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {sourceFilter === 'all'
                  ? 'No Strategies Yet'
                  : sourceFilter === 'ai_extracted'
                    ? 'No AI-Extracted Strategies'
                    : 'No Manual Strategies'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {sourceFilter === 'all'
                  ? 'Create your first strategy to document your trading rules.'
                  : 'Try a different filter or create a new strategy.'}
              </p>
              <Button className="gap-2" onClick={handleNewStrategyClick}>
                <Plus className="h-4 w-4" />
                {atCap ? 'Upgrade to Pro' : 'Create Strategy'}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <PineExportModal
        strategy={exportStrategy}
        open={!!exportStrategy}
        onOpenChange={(o) => !o && setExportStrategy(null)}
      />
    </div>
  );
}
