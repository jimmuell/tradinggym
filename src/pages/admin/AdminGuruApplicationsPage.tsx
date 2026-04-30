import { useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GuruApp = {
  application_id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  status: string;
  created_at: string;
  plan_state: string;
  trading_style: string | null;
  years_experience: string | null;
  what_you_teach: string | null;
  existing_presence: string | null;
};

export default function AdminGuruApplicationsPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [confirm, setConfirm] = useState<{ app: GuruApp; action: 'approve' | 'reject' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-guru-applications'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_guru_applications');
      if (error) throw error;
      return (data ?? []) as GuruApp[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return statusFilter === 'all' ? data : data.filter((a) => a.status === statusFilter);
  }, [data, statusFilter]);

  const approve = useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase.rpc('admin_approve_guru', { target_user_id: user_id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Application approved. User is now a Guru.');
      qc.invalidateQueries({ queryKey: ['admin-guru-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-overview-stats'] });
      setConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase.rpc('admin_reject_guru', { target_user_id: user_id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Application rejected.');
      qc.invalidateQueries({ queryKey: ['admin-guru-applications'] });
      qc.invalidateQueries({ queryKey: ['admin-overview-stats'] });
      setConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const statusBadge = (s: string) => {
    if (s === 'approved') return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">approved</Badge>;
    if (s === 'rejected') return <Badge variant="destructive">rejected</Badge>;
    return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">pending</Badge>;
  };

  const isPending = approve.isPending || reject.isPending;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Admin
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guru Applications</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No applications match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.application_id}>
                    <TableCell>
                      <div className="font-medium truncate max-w-[200px]">{a.display_name || '—'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{a.email}</div>
                    </TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>
                    <TableCell className="text-xs">{a.years_experience || '—'}</TableCell>
                    <TableCell className="text-xs">{a.trading_style || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={a.status !== 'pending' || isPending}
                          onClick={() => setConfirm({ app: a, action: 'reject' })}
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={a.status !== 'pending' || isPending}
                          onClick={() => setConfirm({ app: a, action: 'approve' })}
                          className="bg-emerald-600 hover:bg-emerald-600/90 text-white"
                        >
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === 'approve' ? 'Approve' : 'Reject'} {confirm?.app.display_name || confirm?.app.email}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === 'approve'
                ? 'This will create a Guru profile and change their role to "guru".'
                : 'This will mark the application as rejected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!confirm) return;
                if (confirm.action === 'approve') approve.mutate(confirm.app.user_id);
                else reject.mutate(confirm.app.user_id);
              }}
              className={confirm?.action === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Working…</> : (confirm?.action === 'approve' ? 'Approve' : 'Reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
