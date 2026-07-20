import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Copy, AlertTriangle, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AdminUser = {
  user_id: string;
  email: string;
  display_name: string | null;
  plan_state: string;
  tier_state: string;
  role: string;
  created_at: string;
  strategy_count: number;
  trade_count: number;
  last_sign_in_at: string | null;
};

const PAGE_SIZE = 20;
const PLAN_OPTIONS = ['starter', 'pro', 'expert', 'guru', 'admin'];
const ROLE_OPTIONS = ['user', 'guru', 'admin', 'investor'];
const TIER_OPTIONS = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];

export default function AdminUsersPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [planEdit, setPlanEdit] = useState<string>('');
  const [roleEdit, setRoleEdit] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteComplete, setDeleteComplete] = useState(false);

  useEffect(() => {
    if (!showDeleteConfirm) setDeleteConfirmEmail('');
  }, [showDeleteConfirm]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-list'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_users');
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return data.filter((u) => {
      if (s && !(u.email?.toLowerCase().includes(s) || (u.display_name ?? '').toLowerCase().includes(s))) return false;
      if (planFilter !== 'all' && u.plan_state !== planFilter) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (tierFilter !== 'all' && u.tier_state !== tierFilter) return false;
      return true;
    });
  }, [data, search, planFilter, roleFilter, tierFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const updatePlan = useMutation({
    mutationFn: async ({ user_id, plan }: { user_id: string; plan: string }) => {
      const { error } = await supabase.rpc('admin_update_user_plan', {
        target_user_id: user_id, new_plan_state: plan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Plan updated');
      qc.invalidateQueries({ queryKey: ['admin-users-list'] });
      setTarget((t) => (t ? { ...t, plan_state: planEdit } : t));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRole = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: user_id, new_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin-users-list'] });
      setTarget((t) => (t ? { ...t, role: roleEdit } : t));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async ({ user_id }: { user_id: string }) => {
      const { error } = await supabase.rpc('admin_delete_user', {
        _target_user_id: user_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User deleted');
      setShowDeleteConfirm(false);
      setDeleteComplete(true);
      qc.invalidateQueries({ queryKey: ['admin-users-list'] });
      qc.invalidateQueries({ queryKey: ['admin-orphan-check'] });
    },
    onError: (e: Error) => toast.error(`Delete failed: ${e.message}`),
  });

  const orphanCheck = useQuery({
    queryKey: ['admin-orphan-check'],
    enabled: deleteComplete,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_check_orphan_records');
      if (error) throw error;
      return (data ?? []) as { table_name: string; orphan_count: number }[];
    },
  });

  const openDetail = (u: AdminUser) => {
    setTarget(u);
    setPlanEdit(u.plan_state);
    setRoleEdit(u.role);
  };

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Admin
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="text-xs text-muted-foreground">{filtered.length} matching</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search email or display name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
          <SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {PLAN_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p === 'starter' ? 'Free' : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(0); }}>
          <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {TIER_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : pageRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No users match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Strategies</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((u) => (
                  <TableRow key={u.user_id} className="cursor-pointer" onClick={() => openDetail(u)}>
                    <TableCell className="font-medium truncate max-w-[220px]">{u.email}</TableCell>
                    <TableCell className="truncate max-w-[180px]">{u.display_name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell><Badge variant="secondary">{u.plan_state === 'starter' ? 'Free' : u.plan_state}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{u.tier_state}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{u.strategy_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{u.trade_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button size="sm" variant="outline" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      <Sheet open={!!target} onOpenChange={(o) => { if (!o) { setTarget(null); setDeleteComplete(false); } }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>Manage plan and role for this user</SheetDescription>
          </SheetHeader>

          {target && (
            <div className="mt-6 space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Account</h3>
                <div className="rounded-md border border-border p-3 space-y-1.5 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> {target.email}</div>
                  <div><span className="text-muted-foreground">Display name:</span> {target.display_name || '—'}</div>
                  <div><span className="text-muted-foreground">Joined:</span> {new Date(target.created_at).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">User ID:</span>
                    <code className="text-[11px] font-mono truncate flex-1">{target.user_id}</code>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6"
                      onClick={() => { navigator.clipboard.writeText(target.user_id); toast.success('Copied'); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Plan Override</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Current: {target.plan_state === 'starter' ? 'Free' : target.plan_state}</Badge>
                </div>
                <Select value={planEdit} onValueChange={setPlanEdit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p === 'starter' ? 'Free' : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={planEdit === target.plan_state || updatePlan.isPending}
                  onClick={() => updatePlan.mutate({ user_id: target.user_id, plan: planEdit })}
                >
                  Update Plan
                </Button>
                <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  This overrides the user's Stripe subscription state. Use for beta testing and support only.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Role Override</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Current: {target.role}</Badge>
                </div>
                <Select value={roleEdit} onValueChange={setRoleEdit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={roleEdit === target.role || updateRole.isPending}
                  onClick={() => updateRole.mutate({ user_id: target.user_id, role: roleEdit })}
                >
                  Update Role
                </Button>
                <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  Changing role affects sidebar visibility and feature access.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Activity</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Strategies</div>
                    <div className="text-lg font-semibold">{target.strategy_count}</div>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Trades</div>
                    <div className="text-lg font-semibold">{target.trade_count}</div>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">Tier</div>
                    <div className="text-lg font-semibold">{target.tier_state}</div>
                  </div>
                </div>
              </section>

              {deleteComplete ? (
                <section className="space-y-3 border-t border-border pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    User Deleted
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Cascade verification — checking all tables for orphaned records:
                  </p>

                  {orphanCheck.isLoading ? (
                    <div className="space-y-1.5">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : orphanCheck.data ? (
                    <>
                      <div className="rounded-md border border-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Table</th>
                              <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Orphans</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orphanCheck.data.map((row) => (
                              <tr key={row.table_name} className="border-t border-border">
                                <td className="px-3 py-1.5 font-mono">{row.table_name}</td>
                                <td className={cn(
                                  "px-3 py-1.5 text-right tabular-nums font-medium",
                                  row.orphan_count > 0 ? "text-destructive" : "text-green-500"
                                )}>
                                  {row.orphan_count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {orphanCheck.data.every(r => r.orphan_count === 0) ? (
                        <p className="text-xs text-green-500 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          All clean — no orphaned records found.
                        </p>
                      ) : (
                        <p className="text-xs text-destructive flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Orphaned records detected. The admin_delete_user RPC may need updating.
                        </p>
                      )}
                    </>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTarget(null);
                      setDeleteComplete(false);
                    }}
                  >
                    Close
                  </Button>
                </section>
              ) : (
                <section className="space-y-2 rounded-md border border-destructive/40 p-3">
                  <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this user and all their data. This cannot be undone.
                    Removes: profile, trades, strategies, backtests, checklist data, enrollments,
                    and auth account. If this user is a Guru, their classes and enrolled students'
                    enrollments will also be removed.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={target.role === 'admin' || deleteUser.isPending}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {deleteUser.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3" />
                        Delete User
                      </>
                    )}
                  </Button>
                  {target.role === 'admin' && (
                    <p className="text-[11px] text-muted-foreground">Admin accounts cannot be deleted.</p>
                  )}
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This will permanently delete <strong>{target?.email}</strong> and{' '}
                  <strong>all of their records</strong> from the database — including their profile,
                  trades, strategies, backtests, checklist data, quiz attempts, class enrollments,
                  and auth account. If this user is a Guru, their classes, lessons, content, and all
                  student enrollments in those classes will also be deleted.{' '}
                  <strong>This action cannot be undone.</strong>
                </p>
                {target && (
                  <p className="text-xs text-muted-foreground">
                    Strategies: {target.strategy_count} · Trades: {target.trade_count}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Type the user's email to confirm"
            value={deleteConfirmEmail}
            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmEmail !== target?.email || deleteUser.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (target) deleteUser.mutate({ user_id: target.user_id });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
