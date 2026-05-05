import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Lock, KeyRound, Eye, EyeOff, Copy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { toast } from '@/hooks/use-toast';

type AppConfig = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

// Names of platform secrets stored in Lovable Cloud (managed via Lovable, not the app DB).
// This is a reference list only — values are write-only and not exposed to the client.
const MANAGED_SECRETS: { name: string; purpose: string }[] = [
  { name: 'BACKTEST_ENGINE_URL', purpose: 'Backtest engine endpoint' },
  { name: 'BACKTEST_ENGINE_API_KEY', purpose: 'Backtest engine auth key' },
  { name: 'STRIPE_SECRET_KEY', purpose: 'Stripe API (live/test)' },
  { name: 'STRIPE_WEBHOOK_SECRET', purpose: 'Stripe webhook signing' },
  { name: 'STRIPE_TEST_PRO_PRICE_ID', purpose: 'Pro plan price' },
  { name: 'STRIPE_TEST_EXPERT_PRICE_ID', purpose: 'Expert plan price' },
  { name: 'STRIPE_TEST_GURU_PRICE_ID', purpose: 'Guru plan price' },
  { name: 'ANTHROPIC_API_KEY', purpose: 'Anthropic AI' },
  { name: 'LOVABLE_API_KEY', purpose: 'Lovable AI Gateway' },
];

export default function AdminConfigPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<AppConfig> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: configs, isLoading } = useQuery({
    queryKey: ['app_config'],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .order('key');
      if (error) throw error;
      return data as AppConfig[];
    },
  });

  const upsertMut = useMutation({
    mutationFn: async (row: Partial<AppConfig>) => {
      if (row.id) {
        const { error } = await supabase
          .from('app_config')
          .update({
            key: row.key!,
            value: row.value ?? '',
            description: row.description ?? null,
          })
          .eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_config').insert({
          key: row.key!,
          value: row.value ?? '',
          description: row.description ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_config'] });
      setEditing(null);
      toast({ title: 'Saved' });
    },
    onError: (e: Error) => toast({ title: 'Failed to save', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('app_config').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app_config'] });
      setDeleteId(null);
      toast({ title: 'Deleted' });
    },
    onError: (e: Error) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  if (roleLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Configuration</h1>
        <p className="text-muted-foreground text-sm">
          Manage app config values and view platform secret references.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>App Config</CardTitle>
            <CardDescription>
              Non-sensitive key/value settings stored in the database. Safe for URLs, feature flags,
              and tunables. <strong>Do not store API keys or secrets here</strong> — values are
              readable by all admins.
            </CardDescription>
          </div>
          <Button onClick={() => setEditing({ key: '', value: '', description: '' })}>
            <Plus /> New
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : configs && configs.length > 0 ? (
            <div className="space-y-2">
              {configs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-4 rounded-md border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold">{c.key}</div>
                    <div className="font-mono text-xs text-muted-foreground break-all mt-1">
                      {c.value || <span className="italic">(empty)</span>}
                    </div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Pencil />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No config values yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Platform Secrets
          </CardTitle>
          <CardDescription>
            True secrets live in Lovable Cloud's secret store. Click the eye icon to reveal a value
            (admin-only). To update one, ask the Lovable assistant: <em>"Update secret SECRET_NAME"</em>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MANAGED_SECRETS.map((s) => (
              <SecretRow key={s.name} name={s.name} purpose={s.purpose} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit / Create dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit' : 'New'} Config Value</DialogTitle>
            <DialogDescription>
              Stored in the database. Visible to all admins — never put secrets here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cfg-key">Key</Label>
              <Input
                id="cfg-key"
                value={editing?.key ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, key: e.target.value }))}
                placeholder="e.g. FEATURE_BACKTEST_V2_ENABLED"
              />
            </div>
            <div>
              <Label htmlFor="cfg-value">Value</Label>
              <Input
                id="cfg-value"
                value={editing?.value ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, value: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cfg-desc">Description (optional)</Label>
              <Textarea
                id="cfg-desc"
                rows={2}
                value={editing?.description ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editing?.key && upsertMut.mutate(editing)}
              disabled={!editing?.key || upsertMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete config value?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
