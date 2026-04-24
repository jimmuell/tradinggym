import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ExtractedStrategy } from '@/hooks/useExtractStrategy';

export interface ExtractionRecord {
  id: string;
  source_text: string;
  extracted_json: ExtractedStrategy | null;
  saved_strategy_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

/**
 * Invoke the extract-strategy edge function.
 * Maps server error shapes (403 upgrade_required, 429 limit_reached, 402) into Error messages.
 */
export function useExtractStrategy() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sourceText: string) => {
      const { data, error } = await supabase.functions.invoke('extract-strategy', {
        body: { source_text: sourceText },
      });

      // Try to read the server JSON error body from FunctionsHttpError.context
      if (error) {
        let serverBody: Record<string, unknown> | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx: any = (error as any).context;
        try {
          if (ctx && typeof ctx.json === 'function') {
            serverBody = await ctx.json();
          }
        } catch {
          /* ignore */
        }
        if (serverBody) {
          if (serverBody.upgrade_required) {
            throw new Error(
              (serverBody.error as string) ||
                'Upgrade to Pro to use AI Strategy Extraction.',
            );
          }
          if (serverBody.limit_reached) {
            throw new Error(
              (serverBody.error as string) ||
                'Monthly extraction limit reached. Upgrade to Expert for unlimited extractions.',
            );
          }
          if (ctx?.status === 402) {
            throw new Error(
              (serverBody.error as string) ||
                'AI credits exhausted. Please add credits in workspace settings.',
            );
          }
          if (serverBody.error) throw new Error(serverBody.error as string);
        }
        throw new Error(error.message || 'Extraction failed');
      }

      if (data?.error) throw new Error(data.error);
      return data as {
        extraction_id: string;
        strategy: ExtractedStrategy;
        tokens_used?: number;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategy-extractions'] });
      qc.invalidateQueries({ queryKey: ['extraction-usage'] });
    },
  });
}

/**
 * Fetch recent extractions for the current user.
 * Pass `limit` to cap results (Pro = 5, Expert/Guru = undefined for full archive).
 */
export function useExtractionHistory(limit?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['strategy-extractions', limit],
    enabled: !!user?.id,
    queryFn: async (): Promise<ExtractionRecord[]> => {
      let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('strategy_extractions' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ExtractionRecord[];
    },
  });
}

/**
 * Count the current user's extractions since the start of the calendar month.
 */
export function useExtractionUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['extraction-usage'],
    enabled: !!user?.id,
    queryFn: async (): Promise<number> => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('strategy_extractions' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString());

      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * Save an extracted strategy into the strategies table and link back to the extraction row.
 */
export function useSaveExtractedStrategy() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      extractionId,
      strategy,
    }: {
      extractionId: string;
      strategy: ExtractedStrategy;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const entryRulesText = Array.isArray(strategy.entry_rules)
        ? strategy.entry_rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
        : (strategy.entry_rules as unknown as string);
      const exitRulesText = Array.isArray(strategy.exit_rules)
        ? strategy.exit_rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
        : (strategy.exit_rules as unknown as string);

      const { data: saved, error: stratErr } = await supabase
        .from('strategies')
        .insert({
          user_id: user.id,
          name: strategy.name,
          description: strategy.description,
          instrument: strategy.instrument === 'Any' ? null : strategy.instrument,
          timeframe: strategy.timeframe === 'Any' ? null : strategy.timeframe,
          direction_bias: strategy.direction_bias,
          entry_rules: entryRulesText,
          exit_rules: exitRulesText,
          notes: strategy.notes,
          is_system: false,
          tier_required: 'foundation',
        })
        .select('id')
        .single();

      if (stratErr) throw stratErr;

      await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('strategy_extractions' as any)
        .update({ saved_strategy_id: saved.id })
        .eq('id', extractionId);

      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategies'] });
      qc.invalidateQueries({ queryKey: ['strategy-extractions'] });
    },
  });
}
