import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateBacktestRun, type NewBacktestRun } from './useBacktestRuns';

export function useRunBacktest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const createRun = useCreateBacktestRun();

  return useMutation({
    mutationFn: async (input: NewBacktestRun) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Step 1: Create the backtest_runs row with status='pending'
      const run = await createRun.mutateAsync(input);

      // Step 2: Kick off the Edge Function (don't await full completion — polling will pick up results)
      // The invoke body is the load-bearing source of truth for the validation budget:
      // the edge function reads body.run_validation / body.validation_iterations (with its own
      // defaults if omitted). Forward the values used so the engine receives the real budget.
      const { data, error } = await supabase.functions.invoke('run-backtest', {
        body: {
          run_id: run.id,
          run_validation: input.run_validation,
          validation_iterations: input.validation_iterations,
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
