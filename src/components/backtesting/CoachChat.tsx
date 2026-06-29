import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GraduationCap, Loader2, Send, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTier } from '@/contexts/TierContext';
import type { BacktestRun } from '@/hooks/useBacktestRuns';

interface TeachingEntry {
  dimension: string;
  delta_net: number;
  direction: string;
  significance: string;
  primary_worst_loss: number;
  variant_worst_loss: number;
  trade_count: number;
  delta_ci_low: number;
  delta_ci_high: number;
  sufficient_data: boolean;
}

interface Props {
  run: BacktestRun;
  teaching: TeachingEntry;
  sameSignal: boolean;
  cardMessage: string;
  mockMode?: boolean;
}


interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const ALLOWED_PLANS = new Set(['pro', 'expert', 'guru', 'admin']);

export default function CoachChat({ run, teaching, sameSignal, cardMessage, mockMode }: Props) {
  const { planState, isAdmin } = useTier();
  const canCoach = isAdmin || ALLOWED_PLANS.has(planState);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (canCoach) inputRef.current?.focus();
  }, [canCoach, messages.length]);

  if (!canCoach) {
    return (
      <div className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground flex items-center gap-2">
        <Lock className="size-3.5" />
        Upgrade to Pro to chat with the coach about this result.
      </div>
    );
  }

  const detail = (run.results_detail ?? {}) as Record<string, unknown>;
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
            run_id: run.id,
            teaching,
            same_signal: sameSignal,
            kpis,
            card_message: cardMessage,
          },
          messages: next,
          mock: mockMode === true,
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
      // Fail-safe: preserve the user message, append a clearly-marked error
      // bubble, and leave the input empty AND enabled.
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '_Coach is unavailable — try again._' },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 border-t pt-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <GraduationCap className="size-3.5" />
        Ask the coach
      </div>

      {messages.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                <ReactMarkdown
                  allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'code']}
                  unwrapDisallowed
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            ),
          )}
        </div>
      )}

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
    </div>
  );
}
