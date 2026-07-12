import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, Loader2, GraduationCap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTier } from '@/contexts/TierContext';
import { COACH_CHAT_ENABLED } from '@/lib/featureFlags';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

interface TeachingEntry {
  dimension: string;
  delta_net: number;
  direction: string;
  significance: string;
  delta_ci_low: number;
  delta_ci_high: number;
  trade_count: number;
  sufficient_data: boolean;
  primary_worst_loss?: number;
  variant_worst_loss?: number;
}

interface Props {
  run: BacktestRun | null;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const ALLOWED_PLANS = new Set(['pro', 'expert', 'guru', 'admin']);

function dollars(n: number): string {
  return `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function signedDollars(n: number): string {
  const sign = n >= 0 ? '' : '-';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function buildCardMessage(t: TeachingEntry): string {
  if (t.significance === 'inconclusive') {
    return `Your stop made no meaningful difference here — within normal noise. Worst loss with the stop: ${signedDollars(t.primary_worst_loss ?? 0)}. Without it: ${signedDollars(t.variant_worst_loss ?? 0)}.`;
  }
  if (t.significance === 'saved') {
    return `Your stop SAVED you ${dollars(t.delta_net)} over ${t.trade_count} trades. Worst loss with the stop: ${signedDollars(t.primary_worst_loss ?? 0)}. Without it: ${signedDollars(t.variant_worst_loss ?? 0)}.`;
  }
  if (t.significance === 'cost') {
    return `Your stop COST you ${dollars(t.delta_net)} over ${t.trade_count} trades.`;
  }
  return '';
}

export default function BacktestCoachPanel({ run }: Props) {
  const { planState, isAdmin, loading: tierLoading } = useTier();
  const canCoach = !tierLoading && (isAdmin || ALLOWED_PLANS.has(planState));
  const showCoach = COACH_CHAT_ENABLED || isAdmin;

  const [open, setOpen] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  if (!run || !canCoach || !showCoach) return null;

  const detail = (run.results_detail ?? {}) as Record<string, unknown>;
  const rawTeaching = detail._teaching ?? (detail as { teaching?: unknown }).teaching;
  const teachingArr: TeachingEntry[] | undefined = Array.isArray(rawTeaching)
    ? (rawTeaching as TeachingEntry[])
    : rawTeaching && typeof rawTeaching === 'object'
      ? [rawTeaching as TeachingEntry]
      : undefined;
  const sameSignal = detail._same_signal as boolean | undefined;

  // Show the button whenever this run has any usable teaching data.
  // Prefer the stop block as chat context, but fall back to the first available
  // dimension so runs without a stop still get a coach.
  if (!teachingArr || teachingArr.length === 0 || sameSignal !== true) return null;
  const stopBlock =
    teachingArr.find((x) => x.dimension === 'stop') ?? teachingArr[0];

  const cardMessage = buildCardMessage(stopBlock);

  const kpis: Record<string, unknown> = {
    net_pnl: (run as unknown as Record<string, unknown>).net_pnl ?? detail.net_pnl,
    win_rate: (run as unknown as Record<string, unknown>).win_rate ?? detail.win_rate,
    max_drawdown:
      (run as unknown as Record<string, unknown>).max_drawdown ?? detail.max_drawdown,
    total_trades:
      (run as unknown as Record<string, unknown>).total_trades ?? detail.total_trades,
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const next: ChatMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('coach-agent', {
        body: {
          context: {
            run_id: run!.id,
            teaching: stopBlock,
            same_signal: sameSignal === true,
            kpis,
            card_message: cardMessage,
          },
          messages: next,
          mock: isAdmin && mockMode,
        },
      });

      if (error) throw error;
      const reply = (data as { reply?: string; remaining?: number })?.reply;
      const rem = (data as { remaining?: number })?.remaining;
      if (!reply) throw new Error('Empty reply');
      if (typeof rem === 'number') setRemaining(rem);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      toast.error('Coach is unavailable', { description: String(err) });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '_Coach is unavailable — try again._' },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          Ask the Coach
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              Ask the Coach
            </DialogTitle>
            <div className="flex items-center gap-3">
              {remaining !== null && !isAdmin && (
                <span className="text-[11px] text-muted-foreground">
                  {remaining} left today
                </span>
              )}
              {isAdmin && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Label htmlFor="coach-mock-toggle" className="text-xs cursor-pointer">
                    {mockMode ? 'Mock' : 'Live'}
                  </Label>
                  <Switch
                    id="coach-mock-toggle"
                    checked={mockMode}
                    onCheckedChange={setMockMode}
                    aria-label="Toggle coach mock mode"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-[240px] max-h-[60vh] overflow-y-auto space-y-2 rounded-md border border-border p-3"
        >
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ask a question about this backtest result. Your questions will stay here while
              you're on this page.
            </p>
          ) : (
            messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div
                  key={i}
                  className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
                >
                  <ReactMarkdown
                    allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'code']}
                    unwrapDisallowed
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              ),
            )
          )}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Coach is thinking…
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e as unknown as FormEvent);
              }
            }}
            placeholder="Ask about this result…"
            rows={2}
            className="min-h-[44px] h-[44px] resize-none text-sm transition-none"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !input.trim()}
            aria-label="Send"
            className="transition-none shrink-0"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
