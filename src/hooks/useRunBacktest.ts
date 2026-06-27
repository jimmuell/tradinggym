import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateBacktestRun, type NewBacktestRun } from './useBacktestRuns';

// force_regenerate is a transient edge-function flag, NOT a backtest_runs column.
// It must never be inserted into the row — it rides only on the function invoke body.
export type RunBacktestInput = NewBacktestRun & { force_regenerate?: boolean };

export function useRunBacktest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const createRun = useCreateBacktestRun();

  return useMutation({
    mutationFn: async (input: RunBacktestInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Split the transient flag off the row fields before insert.
      const { force_regenerate, ...rowInput } = input;

      // Step 1: Create the backtest_runs row with status='pending'
      const run = await createRun.mutateAsync(rowInput);

      // Step 2: Kick off the Edge Function (don't await full completion — polling picks up results).
      // The invoke body is the load-bearing source of truth for the validation budget and the
      // optional force-regenerate flag: the edge function reads body.run_validation /
      // body.validation_iterations / body.force_regenerate (with its own defaults if omitted).
      const { data, error } = await supabase.functions.invoke('run-backtest', {
        body: {
          run_id: run.id,
          run_validation: rowInput.run_validation,
          validation_iterations: rowInput.validation_iterations,
          // Only send when explicitly requested — keeps normal runs on the cache-hit path.
          ...(force_regenerate ? { force_regenerate: true } : {}),
        },
      });

      if (error) throw error;
      return { run_id: run.id, ...(data || {}) };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backtest_runs', user?.id] });
    },
  });
}
