import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ChecklistStep = {
  section: 'session_prep' | 'trade_execution';
  label: string;
  is_core: boolean;
};

export type ExtractedStrategy = {
  name: string;
  description: string;
  instrument: string;
  timeframe: string;
  direction_bias: 'long_only' | 'short_only' | 'both';
  entry_rules: string[];
  exit_rules: string[];
  checklist_steps: ChecklistStep[];
  notes: string;
  confidence: 'high' | 'medium' | 'low';
};

export type ExtractStrategyResponse = {
  strategy: ExtractedStrategy;
  tokens_used: number;
  source_type: string;
};

export type ExtractStrategyInput = {
  text: string;
  source_type: 'youtube_transcript' | 'article' | 'notes';
};

export function useExtractStrategy() {
  return useMutation({
    mutationFn: async (input: ExtractStrategyInput): Promise<ExtractStrategyResponse> => {
      const { data, error } = await supabase.functions.invoke('extract-strategy', {
        body: input,
      });
      if (error) {
        // Try to extract server-provided error message
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx: any = (error as any).context;
        let msg = error.message;
        try {
          if (ctx && typeof ctx.json === 'function') {
            const j = await ctx.json();
            if (j?.error) msg = j.error;
          }
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      return data as ExtractStrategyResponse;
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Extraction failed');
    },
  });
}
