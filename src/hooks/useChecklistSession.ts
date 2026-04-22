import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ChecklistSession = {
  id: string;
  user_id: string;
  template_id: string;
  strategy_name: string;
  session_date: string;
  session_prep_completed: Record<string, string | boolean | number>;
  execution_completed: Record<string, string | boolean | number>;
  prep_complete: boolean;
  execution_complete: boolean;
  emotional_readiness: boolean;
  max_daily_loss: number | null;
  trading_session: string | null;
  htf_bias: string | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function useTodayChecklistSession() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['checklist-session-today', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_sessions')
        .select('*')
        .eq('session_date', todayISO())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ChecklistSession | null;
    },
  });
}

export function useCreateChecklistSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      templateId,
      strategyName,
    }: {
      templateId: string;
      strategyName: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('checklist_sessions')
        .insert({
          user_id: user.id,
          template_id: templateId,
          strategy_name: strategyName,
          session_date: todayISO(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChecklistSession;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-session-today'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateChecklistSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ChecklistSession>;
    }) => {
      const { error } = await supabase
        .from('checklist_sessions')
        .update(patch as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-session-today'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
