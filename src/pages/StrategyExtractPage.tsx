import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, ArrowLeft, Wand2, Check, AlertTriangle, ShieldAlert,
  Lock, Loader2, RotateCcw, Save, ListChecks, ChevronDown, ChevronRight,
  History, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { useExtractStrategy, ExtractedStrategy } from '@/hooks/useExtractStrategy';
import { useExtractionHistory, useExtractionUsage } from '@/hooks/useStrategyExtraction';

type SourceType = 'youtube_transcript' | 'article' | 'notes';

const SOURCE_TABS: { value: SourceType; label: string; placeholder: string }[] = [
  {
    value: 'youtube_transcript',
    label: 'YouTube Transcript',
    placeholder:
      'Paste the YouTube transcript here... You can get this from YouTube → three dots → Show transcript → Copy',
  },
  { value: 'article', label: 'Article', placeholder: 'Paste the article text here...' },
  { value: 'notes', label: 'Notes', placeholder: 'Paste your trading notes here...' },
];

const PROGRESS_MESSAGES = [
  'Reading your content...',
  'Identifying trading patterns...',
  'Extracting entry and exit rules...',
  'Building your blueprint...',
  'Generating checklist steps...',
];

const MAX_CHARS = 50000;
const MIN_CHARS = 100;

function ConfidenceBanner({ confidence }: { confidence: ExtractedStrategy['confidence'] }) {
  const map = {
    high: {
      cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      icon: Check,
      msg: 'High confidence — a clear, well-defined strategy was found',
    },
    medium: {
      cls: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      icon: AlertTriangle,
      msg: 'Medium confidence — a strategy was found but some rules may need refinement',
    },
    low: {
      cls: 'border-red-500/40 bg-red-500/10 text-red-400',
      icon: ShieldAlert,
      msg: "Low confidence — the content doesn't describe a clear strategy. Results may be incomplete.",
    },
  }[confidence];
  const Icon = map.icon;
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${map.cls}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{map.msg}</p>
    </div>
  );
}

export default function StrategyExtractPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planState } = useTier();
  const qc = useQueryClient();
  const isStarter = planState === 'starter';

  const [sourceType, setSourceType] = useState<SourceType>('youtube_transcript');
  const [text, setText] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [strategy, setStrategy] = useState<ExtractedStrategy | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const extract = useExtractStrategy();
  const isPro = planState === 'pro';
  const isUnlimited = planState === 'expert' || planState === 'guru';
  const historyLimit = isPro ? 5 : undefined;
  const { data: history, isLoading: historyLoading } = useExtractionHistory(historyLimit);
  const { data: usageCount } = useExtractionUsage();
  const remaining = isPro ? Math.max(0, 2 - (usageCount ?? 0)) : null;
  const outOfCredits = isPro && remaining === 0;
  const [historyOpen, setHistoryOpen] = useState(false);

  // Rotate progress messages every 3s while loading
  useEffect(() => {
    if (!extract.isPending) {
      setProgressIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [extract.isPending]);

  const charCount = text.length;
  const placeholder = useMemo(
    () => SOURCE_TABS.find((s) => s.value === sourceType)?.placeholder ?? '',
    [sourceType],
  );
  const canSubmit =
    charCount >= MIN_CHARS &&
    charCount <= MAX_CHARS &&
    !extract.isPending &&
    !outOfCredits;

  const handleExtract = async () => {
    if (!canSubmit) return;
    try {
      const res = await extract.mutateAsync({ text, source_type: sourceType });
      setStrategy(res.strategy);
      setCollapsed(true);
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch {
      // toast handled in hook
    }
  };

  const handleTryAgain = () => {
    setStrategy(null);
    setCollapsed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save mutations
  const saveStrategyMut = useMutation({
    mutationFn: async (s: ExtractedStrategy) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('strategies')
        .insert({
          user_id: user.id,
          name: s.name,
          description: s.description,
          instrument: s.instrument === 'Any' ? null : s.instrument,
          timeframe: s.timeframe === 'Any' ? null : s.timeframe,
          direction_bias: s.direction_bias,
          entry_rules: s.entry_rules.map((r, i) => `${i + 1}. ${r}`).join('\n'),
          exit_rules: s.exit_rules.map((r, i) => `${i + 1}. ${r}`).join('\n'),
          notes: s.notes,
          is_system: false,
          tier_required: 'foundation',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const saveChecklistMut = useMutation({
    mutationFn: async (s: ExtractedStrategy) => {
      if (!user?.id) throw new Error('Not authenticated');
      const sessionPrep = s.checklist_steps
        .filter((c) => c.section === 'session_prep')
        .map((c, i) => ({
          id: `sp-ai-${i + 1}`,
          label: c.label,
          type: 'toggle' as const,
          is_core: c.is_core,
        }));
      const execution = s.checklist_steps
        .filter((c) => c.section === 'trade_execution')
        .map((c, i) => ({
          id: `ex-ai-${i + 1}`,
          label: c.label,
          type: 'toggle' as const,
          is_core: c.is_core,
        }));
      const { error } = await supabase.from('checklist_templates').insert({
        user_id: user.id,
        strategy_name: s.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session_prep_items: sessionPrep as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execution_items: execution as any,
        is_default: false,
      });
      if (error) throw error;
    },
  });

  const handleSaveStrategy = async () => {
    if (!strategy) return;
    try {
      await saveStrategyMut.mutateAsync(strategy);
      qc.invalidateQueries({ queryKey: ['strategies'] });
      toast.success('Strategy saved');
      navigate('/strategies');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save strategy');
    }
  };

  const handleSaveChecklist = async () => {
    if (!strategy) return;
    try {
      await saveChecklistMut.mutateAsync(strategy);
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Checklist template created — available in your pre-trade checklist');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save checklist');
    }
  };

  const handleSaveBoth = async () => {
    if (!strategy) return;
    try {
      await Promise.all([
        saveStrategyMut.mutateAsync(strategy),
        saveChecklistMut.mutateAsync(strategy),
      ]);
      qc.invalidateQueries({ queryKey: ['strategies'] });
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Strategy and checklist saved');
      navigate('/strategies');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 -ml-2"
          onClick={() => navigate('/strategies')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Strategies
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">AI Strategy Extractor</h1>
              <Badge variant="outline" className="border-primary/40 text-primary">Pro</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Paste a YouTube transcript or article and let AI extract a structured trading blueprint
            </p>
          </div>
        </div>
      </div>

      {/* Input section (with possible upgrade overlay) */}
      <div className="relative">
        <Card className={collapsed ? 'opacity-90' : ''}>
          <CardContent className="p-6 space-y-4">
            {collapsed ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {SOURCE_TABS.find((s) => s.value === sourceType)?.label}
                  </span>{' '}
                  · {charCount.toLocaleString()} characters
                </div>
                <Button variant="outline" size="sm" onClick={() => setCollapsed(false)}>
                  Edit
                </Button>
              </div>
            ) : (
              <>
                {/* Source tabs */}
                <div className="flex flex-wrap gap-2">
                  {SOURCE_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setSourceType(tab.value)}
                      disabled={isStarter}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        sourceType === tab.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <div className="relative">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                    placeholder={placeholder}
                    rows={10}
                    disabled={isStarter || extract.isPending}
                    className="resize-y min-h-[200px] max-h-[600px] pr-3 pb-8"
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                    {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                  </div>
                </div>

                {/* Extract button or progress */}
                {extract.isPending ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="font-medium">{PROGRESS_MESSAGES[progressIdx]}</span>
                    </div>
                    <Progress value={undefined} className="h-2 animate-pulse" />
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleExtract}
                    disabled={!canSubmit || isStarter}
                  >
                    <Wand2 className="h-4 w-4" />
                    Extract Strategy
                  </Button>
                )}
                {charCount > 0 && charCount < MIN_CHARS && (
                  <p className="text-xs text-muted-foreground text-center">
                    Need at least {MIN_CHARS} characters ({MIN_CHARS - charCount} more)
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Starter upgrade overlay */}
        {isStarter && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
            <div className="text-center space-y-4 p-6 max-w-md">
              <div className="mx-auto rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                AI Strategy Extraction is a Pro feature
              </h3>
              <Button
                size="lg"
                onClick={() => navigate('/pricing?highlight=pro')}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro — $29/mo
              </Button>
              <p className="text-sm text-muted-foreground">
                Extract trading strategies from any YouTube video or article automatically
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {strategy && (
        <div ref={resultsRef} className="space-y-6 animate-fade-in">
          <ConfidenceBanner confidence={strategy.confidence} />

          {/* Strategy summary card */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{strategy.name}</h2>
              <p className="text-muted-foreground leading-relaxed">{strategy.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">{strategy.instrument}</Badge>
                <Badge variant="secondary">{strategy.timeframe}</Badge>
                <Badge variant="secondary">{strategy.direction_bias}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Entry Rules */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded bg-emerald-500" />
              Entry Rules
            </h3>
            <div className="space-y-2">
              {strategy.entry_rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border-l-4 border-emerald-500 bg-card p-4"
                >
                  <span className="text-sm font-mono text-muted-foreground shrink-0">
                    {i + 1}.
                  </span>
                  <p className="text-sm text-foreground">{rule}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Exit Rules */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded bg-red-500" />
              Exit Rules
            </h3>
            <div className="space-y-2">
              {strategy.exit_rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border-l-4 border-red-500 bg-card p-4"
                >
                  <span className="text-sm font-mono text-muted-foreground shrink-0">
                    {i + 1}.
                  </span>
                  <p className="text-sm text-foreground">{rule}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Checklist Preview */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Checklist Preview
            </h3>
            {(['session_prep', 'trade_execution'] as const).map((section) => {
              const items = strategy.checklist_steps.filter((s) => s.section === section);
              if (items.length === 0) return null;
              return (
                <div key={section} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {section === 'session_prep' ? 'Session Prep' : 'Trade Execution'}
                  </h4>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 py-1"
                        >
                          <div className="h-4 w-4 rounded border border-muted-foreground/40 shrink-0" />
                          <span className="text-sm text-foreground flex-1">{item.label}</span>
                          {item.is_core && (
                            <Badge variant="outline" className="text-xs">Core</Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </section>

          {/* Notes */}
          {strategy.notes && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Notes</h3>
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {strategy.notes}
                  </p>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}

      {/* Sticky action bar */}
      {strategy && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm z-40">
          <div className="max-w-4xl mx-auto p-4 flex flex-wrap gap-2 justify-end items-center">
            <Button variant="ghost" size="sm" onClick={handleTryAgain} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveChecklist}
              disabled={saveChecklistMut.isPending}
              className="gap-2"
            >
              <ListChecks className="h-4 w-4" />
              Save as Checklist
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveBoth}
              disabled={saveStrategyMut.isPending || saveChecklistMut.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Both
            </Button>
            <Button
              size="sm"
              onClick={handleSaveStrategy}
              disabled={saveStrategyMut.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Strategy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
