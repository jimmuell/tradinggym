import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChecklistContent } from '@/components/checklist/ChecklistContent';
import { useLogTrade, useTodayLiveTrades } from '@/hooks/useLogTrade';
import { useTodayChecklistSession } from '@/hooks/useChecklistSession';
import { cn } from '@/lib/utils';

type Direction = 'long' | 'short';
type Result = 'win' | 'loss' | 'breakeven';

export default function CompanionPage() {
  const { data: session } = useTodayChecklistSession();
  const logTrade = useLogTrade();
  const { data: trades, isLoading: tradesLoading } = useTodayLiveTrades();

  const [direction, setDirection] = useState<Direction | null>(null);
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [target, setTarget] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const reset = () => {
    setDirection(null);
    setEntry('');
    setStop('');
    setTarget('');
    setResult(null);
  };

  const canSubmit =
    direction &&
    entry.trim() &&
    stop.trim() &&
    target.trim() &&
    Number.isFinite(Number(entry)) &&
    Number.isFinite(Number(stop)) &&
    Number.isFinite(Number(target));

  const handleSubmit = () => {
    if (!canSubmit || !direction) return;
    logTrade.mutate(
      {
        direction,
        entry_price: Number(entry),
        stop_loss: Number(stop),
        take_profit: Number(target),
        result: result ?? null,
        checklist_session_id: session?.id ?? null,
      },
      {
        onSuccess: () => {
          toast.success('Trade logged');
          reset();
        },
        onError: (err: Error) => toast.error(err.message ?? 'Failed to log trade'),
      },
    );
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Section A — Pre-Trade Checklist */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm">Pre-Trade Checklist</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <ChecklistContent mode="companion" active />
        </CardContent>
      </Card>

      {/* Section B — Quick Trade Entry */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm">Log Trade</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          {/* Direction */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Direction
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={direction === 'long' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirection('long')}
                className={cn(direction === 'long' && 'bg-emerald-600 hover:bg-emerald-700')}
              >
                <ArrowUp className="h-4 w-4" /> Long
              </Button>
              <Button
                type="button"
                variant={direction === 'short' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirection('short')}
                className={cn(direction === 'short' && 'bg-rose-600 hover:bg-rose-700')}
              >
                <ArrowDown className="h-4 w-4" /> Short
              </Button>
            </div>
          </div>

          {/* Prices */}
          <div className="space-y-1.5">
            <Label className="text-xs">Entry price</Label>
            <Input
              type="number"
              step="0.25"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Stop loss</Label>
              <Input
                type="number"
                step="0.25"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Take profit</Label>
              <Input
                type="number"
                step="0.25"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Result */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Result (optional)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(['win', 'loss', 'breakeven'] as Result[]).map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={result === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setResult(result === r ? null : r)}
                  className="capitalize text-xs"
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!canSubmit || logTrade.isPending}
            onClick={handleSubmit}
          >
            {logTrade.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Logging…
              </>
            ) : (
              'Log Trade'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent trades */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm">Today's Trades</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {tradesLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : !trades || trades.length === 0 ? (
            <p className="text-xs text-muted-foreground">No trades logged yet today.</p>
          ) : (
            <ul className="space-y-2">
              {trades.slice(0, 3).map((t) => {
                const time = t.opened_at
                  ? new Date(t.opened_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-xs border border-border rounded-md px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {t.direction === 'long' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className="font-mono">{t.entry_price}</span>
                      <span className="text-muted-foreground">{time}</span>
                    </div>
                    {t.result ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize text-[10px] px-1.5 py-0',
                          t.result === 'win' && 'border-emerald-500/40 text-emerald-500',
                          t.result === 'loss' && 'border-rose-500/40 text-rose-500',
                          t.result === 'breakeven' && 'border-muted-foreground/40',
                        )}
                      >
                        {t.result}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        open
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
