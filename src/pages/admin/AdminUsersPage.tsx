import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  role: string;
  plan_state: string;
  tier_state: string;
  created_at: string;
};

export default function AdminUsersPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<ProfileRow | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    enabled: isAdmin,
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('user_id, display_name, role, plan_state, tier_state, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (search.trim()) q = q.ilike('display_name', `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: ProfileRow) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: row.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: 'User deleted', description: 'Account and related data removed.' });
      setTarget(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    },
  });

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Admin
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by display name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data?.length ? (
            <p className="p-6 text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between gap-4 p-3 px-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {u.display_name || '(no name)'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {u.user_id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{u.role}</Badge>
                    <Badge variant="secondary">{u.plan_state}</Badge>
                    <Badge variant="secondary">{u.tier_state}</Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setTarget(u)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{target?.display_name || target?.user_id}</strong> from
              authentication and deletes all of their data (trades, strategies, enrollments, etc.).
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (target) deleteMutation.mutate(target);
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Deleting…</>
              ) : (
                'Delete user'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
