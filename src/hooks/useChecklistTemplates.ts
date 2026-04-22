import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ChecklistItem = {
  id: string;
  label: string;
  type: 'toggle' | 'select' | 'input';
  is_core?: boolean;
  options?: string[];
  input_type?: 'currency' | 'text';
};

export type ChecklistTemplate = {
  id: string;
  user_id: string;
  strategy_id: string | null;
  strategy_name: string;
  session_prep_items: ChecklistItem[];
  execution_items: ChecklistItem[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export function useChecklistTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['checklist-templates', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChecklistTemplate[];
    },
  });
}

export function useSeedDefaultChecklists() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('seed_default_checklists', {
        target_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
    },
  });
}

export function useSaveChecklistTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (template: Partial<ChecklistTemplate> & { id?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (template.id) {
        const { error } = await supabase
          .from('checklist_templates')
          .update({
            strategy_name: template.strategy_name,
            session_prep_items: template.session_prep_items as never,
            execution_items: template.execution_items as never,
          })
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('checklist_templates').insert({
          user_id: user.id,
          strategy_name: template.strategy_name ?? 'Custom',
          session_prep_items: (template.session_prep_items ?? []) as never,
          execution_items: (template.execution_items ?? []) as never,
          is_default: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteChecklistTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
    },
  });
}
