import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RiskAcknowledgmentModalProps {
  open: boolean;
  onAcknowledged: () => void;
}

export default function RiskAcknowledgmentModal({ open, onAcknowledged }: RiskAcknowledgmentModalProps) {
  const [checked, setChecked] = useState(false);

  const ack = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('update_own_profile', {
        p_risk_acknowledged_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => onAcknowledged(),
    onError: (err: Error) => toast.error(err.message || 'Failed to save acknowledgment'),
  });

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-500" />
            Congratulations — Foundation Complete!
          </AlertDialogTitle>
        </AlertDialogHeader>

        <p className="text-sm text-muted-foreground">
          Before you unlock the Trading Simulator and start practicing, please read and acknowledge the following:
        </p>

        <div className="max-h-[250px] overflow-y-auto rounded-md border border-border bg-muted/30 p-4 text-sm space-y-3 text-foreground/90">
          <p>• TradingGYM is an educational platform for learning and practicing trading strategies in a simulated environment.</p>
          <p>• No real money is at risk when using the TradingGYM simulator.</p>
          <p>• Past simulated performance does not guarantee future results in live trading.</p>
          <p>• Trading futures involves substantial risk of loss. You should never trade with money you cannot afford to lose.</p>
          <p>• TradingGYM does not provide financial advice. Content is educational only. Consult a qualified financial advisor before trading with real capital.</p>
        </div>

        <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
          />
          <span>
            I understand that trading carries risk and TradingGYM is an educational tool, not financial advice.
          </span>
        </label>

        <div className="flex justify-end">
          <Button
            disabled={!checked || ack.isPending}
            onClick={() => ack.mutate()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {ack.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Unlock Trading Simulator →
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
