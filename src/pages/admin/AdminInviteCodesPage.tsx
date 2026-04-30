import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Plus, Loader2, PowerOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type InviteCode = {
  id: string;
  code: string;
  created_by: string | null;
  assigned_to_email: string | null;
  purpose: string | null;
  max_uses: number | null;
  times_used: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string;
};

const PURPOSES = [
  { value: 'guru', label: 'Beta Guru', short: 'GURU' },
  { value: 'beta', label: 'Beta Tester', short: 'BETA' },
  { value: 'press', label: 'Press', short: 'PRES' },
  { value: 'other', label: 'Other', short: 'OTHR' },
];

function randomSegment(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

export default function AdminInviteCodesPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [assignedEmail, setAssignedEmail] = useState('');
  const [purpose, setPurpose] = useState('beta');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<InviteCode | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-invite-codes'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as InviteCode[];
    },
  });

  const createCode = useMutation({
    mutationFn: async () => {
      const purposeMeta = PURPOSES.find((p) => p.value === purpose) || PURPOSES[1];
      const code = `TG-${purposeMeta.short}-${randomSegment(6)}`;
      const { error } = await (supabase as any).from('invite_codes').insert({
        code,
        created_by: user?.id ?? null,
        assigned_to_email: assignedEmail.trim() || null,
        purpose,
        max_uses: maxUses,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      toast.success('Invite code generated', { description: code });
      qc.invalidateQueries({ queryKey: ['admin-invite-codes'] });
      qc.invalidateQueries({ queryKey: ['admin-overview-stats'] });
      setOpen(false);
      setAssignedEmail('');
      setPurpose('beta');
      setMaxUses(1);
      setExpiresAt('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('invite_codes')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Code deactivated');
      qc.invalidateQueries({ queryKey: ['admin-invite-codes'] });
      qc.invalidateQueries({ queryKey: ['admin-overview-stats'] });
      setDeactivateTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const computeStatus = (c: InviteCode) => {
    if (!c.is_active) return <Badge variant="outline">Inactive</Badge>;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return <Badge variant="destructive">Expired</Badge>;
    if ((c.times_used ?? 0) >= (c.max_uses ?? 1)) return <Badge variant="secondary">Used up</Badge>;
    return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Active</Badge>;
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Admin
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invite Codes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Generate Code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invite Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Assigned to (email, optional)</Label>
                <Input id="email" type="email" value={assignedEmail}
                  onChange={(e) => setAssignedEmail(e.target.value)}
                  placeholder="user@example.com" />
              </div>
              <div>
                <Label>Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max-uses">Max uses</Label>
                <Input id="max-uses" type="number" min={1} value={maxUses}
                  onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value) || 1))} />
              </div>
              <div>
                <Label htmlFor="expires">Expires (optional)</Label>
                <Input id="expires" type="date" value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={createCode.isPending}>Cancel</Button>
              <Button onClick={() => createCode.mutate()} disabled={createCode.isPending}>
                {createCode.isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating…</> : 'Generate Code'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data?.length ? (
            <p className="p-6 text-sm text-muted-foreground">No invite codes yet. Generate one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><code className="text-xs font-mono">{c.code}</code></TableCell>
                    <TableCell><Badge variant="secondary">{c.purpose ?? 'beta'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {c.assigned_to_email || '—'}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{c.times_used ?? 0} / {c.max_uses ?? 1}</TableCell>
                    <TableCell>{computeStatus(c)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(c.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7"
                          disabled={!c.is_active}
                          onClick={() => setDeactivateTarget(c)}
                        >
                          <PowerOff className="h-3 w-3" />
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

      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this code?</AlertDialogTitle>
            <AlertDialogDescription>
              <code className="font-mono text-xs">{deactivateTarget?.code}</code> will no longer be usable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivate.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deactivate.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deactivateTarget) deactivate.mutate(deactivateTarget.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivate.isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Deactivating…</> : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
