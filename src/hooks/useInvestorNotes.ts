import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InvestorNote {
  id: string;
  author_id: string;
  author_name: string | null;
  content: string;
  parent_id: string | null;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
  replies?: InvestorNote[];
}

export function useInvestorNotes() {
  return useQuery({
    queryKey: ['investor-notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      const all = (data ?? []) as InvestorNote[];
      const byParent = new Map<string, InvestorNote[]>();
      const tops: InvestorNote[] = [];
      for (const n of all) {
        if (n.parent_id) {
          const arr = byParent.get(n.parent_id) ?? [];
          arr.push(n);
          byParent.set(n.parent_id, arr);
        } else {
          tops.push(n);
        }
      }
      return tops.map((t) => ({
        ...t,
        replies: (byParent.get(t.id) ?? []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }));
    },
  });
}

export function useTopInvestorNotes(limit = 3) {
  return useQuery({
    queryKey: ['investor-notes', 'top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_notes')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as InvestorNote[];
    },
  });
}

export function useCreateInvestorNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string | null }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      const author_name = profile?.display_name ?? user.email ?? 'Anonymous';
      const { error } = await supabase.from('investor_notes').insert({
        author_id: user.id,
        author_name,
        content,
        parent_id: parentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investor-notes'] });
      toast.success('Note posted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteInvestorNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('investor_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investor-notes'] });
      toast.success('Note deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleNotePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('investor_notes')
        .update({ is_pinned: pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investor-notes'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
