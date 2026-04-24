import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlaybackScenario } from '@/lib/playbackTypes';

export function usePlaybackScenario(scenarioId: string | null | undefined) {
  return useQuery({
    queryKey: ['playback_scenario', scenarioId],
    enabled: !!scenarioId,
    queryFn: async (): Promise<PlaybackScenario> => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('strategy_playback_scenarios' as any)
        .select('*')
        .eq('id', scenarioId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Scenario not found');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data as any as PlaybackScenario;
    },
  });
}

export function useActivePlaybackScenarios() {
  return useQuery({
    queryKey: ['playback_scenarios', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('strategy_playback_scenarios' as any)
        .select('id, name, description, instrument, timeframe, direction, indicator_tags')
        .eq('is_active', true);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []) as any[];
    },
  });
}
