import { useMemo, useState } from 'react';
import { Copy, Download, FileCode, ChevronDown, ExternalLink, Lock, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useTier } from '@/contexts/TierContext';
import { generatePineScript, safeFilename, ExportableStrategy } from '@/lib/pineScriptExporter';
import { useNavigate } from 'react-router-dom';

interface Props {
  strategy: ExportableStrategy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** monthly export count for Pro users (optional, defaults to 0) */
  exportsUsed?: number;
}

const PRO_MONTHLY_LIMIT = 10;

export function PineExportModal({ strategy, open, onOpenChange, exportsUsed = 0 }: Props) {
  const { planState, isAdmin, loading: tierLoading } = useTier();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [howOpen, setHowOpen] = useState(false);

  // Never show the Starter upgrade lock while the plan is still resolving —
  // that would flash "Upgrade to Pro" to a paying customer on cold open.
  const isLocked = !tierLoading && !isAdmin && planState === 'starter';
  const isPro = !tierLoading && !isAdmin && planState === 'pro';
  const remaining = Math.max(PRO_MONTHLY_LIMIT - exportsUsed, 0);
  const reachedLimit = isPro && remaining <= 0;

  const code = useMemo(() => (strategy ? generatePineScript(strategy) : ''), [strategy]);
  const lineCount = code ? code.split('\n').length : 0;

  const handleCopy = async () => {
    if (reachedLimit) return;
    await navigator.clipboard.writeText(code);
    toast({ title: 'Copied to clipboard!' });
  };

  const handleDownload = () => {
    if (reachedLimit || !strategy) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename(strategy.name || 'strategy');
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: a.download });
  };

  // Upgrade gate for Starter
  if (isLocked) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 w-fit">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Upgrade to Pro</DialogTitle>
            <DialogDescription className="text-center">
              Upgrade to Pro to export your strategies as Pine Script indicators for TradingView.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Pro includes
            </div>
            <ul className="text-muted-foreground space-y-1 pl-6 list-disc">
              <li>Up to {PRO_MONTHLY_LIMIT} Pine Script exports per month</li>
              <li>One-click TradingView integration</li>
              <li>All indicators, filters, and risk rules included</li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Learn More
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate('/pricing');
              }}
            >
              Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                Export to Pine Script
              </DialogTitle>
              <DialogDescription className="text-sm">
                {strategy?.name || 'Strategy'}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 shrink-0">
              Pine Script v5
            </Badge>
          </div>
        </DialogHeader>

        {/* Code preview */}
        <div className="flex-1 overflow-hidden p-6 pt-4 space-y-4">
          <div className="rounded-lg border bg-muted/40 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/60 text-xs text-muted-foreground">
              <span className="font-mono">{strategy?.name ? safeFilename(strategy.name) : 'strategy.pine'}</span>
              <span>{lineCount} lines</span>
            </div>
            <div className="overflow-auto max-h-[40vh] text-xs font-mono leading-relaxed">
              <table className="w-full">
                <tbody>
                  {code.split('\n').map((line, i) => (
                    <tr key={i} className="align-top">
                      <td className="select-none text-right pr-3 pl-3 py-0.5 text-muted-foreground/60 border-r w-12 sticky left-0 bg-muted/40">
                        {i + 1}
                      </td>
                      <td className="px-3 py-0.5 whitespace-pre text-foreground/90">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopy} disabled={reachedLimit} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={reachedLimit} className="gap-2">
              <Download className="h-4 w-4" />
              Download .pine
            </Button>
          </div>

          {/* Instructions */}
          <Collapsible open={howOpen} onOpenChange={setHowOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                <ChevronDown className={`h-4 w-4 transition-transform ${howOpen ? 'rotate-180' : ''}`} />
                How to use this in TradingView
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 pl-6 text-sm text-muted-foreground">
              <ol className="list-decimal space-y-1.5">
                <li>Open TradingView and navigate to your chart</li>
                <li>Click "Pine Editor" at the bottom of the screen</li>
                <li>Click "Open" → "New blank indicator"</li>
                <li>Paste the code (or open the downloaded .pine file)</li>
                <li>Click "Add to Chart"</li>
                <li>The indicator will draw your strategy levels and fire alerts when conditions are met</li>
              </ol>
              <p className="mt-3 text-xs">
                Don't have TradingView?{' '}
                <a
                  href="https://www.tradingview.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Get started free <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Footer counter */}
        {isPro && (
          <div className="px-6 py-3 border-t text-xs text-muted-foreground bg-muted/30">
            {reachedLimit
              ? `You've used all ${PRO_MONTHLY_LIMIT} exports this month. Upgrade to Expert for unlimited exports.`
              : `${exportsUsed} of ${PRO_MONTHLY_LIMIT} exports used this month`}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
