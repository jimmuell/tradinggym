import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Save, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';

interface StrategyRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  instrument: string | null;
  timeframe: string | null;
  direction_bias: string | null;
  entry_rules: string | null;
  exit_rules: string | null;
  notes: string | null;
  is_system: boolean;
  tier_required: string;
  created_at: string;
}

const TIMEFRAMES = ['1m', '2m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];

export default function StrategyDetailPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTier } = useTier();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isFoundation = currentTier === 'foundation';

  const [form, setForm] = useState({
    name: '',
    description: '',
    instrument: '',
    timeframe: '',
    direction_bias: '',
    entry_rules: '',
    exit_rules: '',
    notes: '',
  });
  const [nameError, setNameError] = useState('');

  const { data: strategy, isLoading } = useQuery({
    queryKey: ['strategy', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as StrategyRow | null;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (strategy) {
      setForm({
        name: strategy.name || '',
        description: strategy.description || '',
        instrument: strategy.instrument || '',
        timeframe: strategy.timeframe || '',
        direction_bias: strategy.direction_bias || '',
        entry_rules: strategy.entry_rules || '',
        exit_rules: strategy.exit_rules || '',
        notes: strategy.notes || '',
      });
    }
  }, [strategy]);

  const isSystem = strategy?.is_system === true;
  const isOwner = !isNew && strategy?.user_id === user?.id;
  const readOnly = isSystem;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error('Name is required');
      if (isNew) {
        const payload: {
          user_id: string;
          name: string;
          description: string | null;
          notes: string | null;
          is_system: boolean;
          tier_required: string;
          instrument?: string | null;
          timeframe?: string | null;
          direction_bias?: string | null;
          entry_rules?: string | null;
          exit_rules?: string | null;
        } = {
          user_id: user!.id,
          name: form.name.trim(),
          description: form.description || null,
          notes: form.notes || null,
          is_system: false,
          tier_required: 'foundation',
        };
        if (!isFoundation) {
          payload.instrument = form.instrument || null;
          payload.timeframe = form.timeframe || null;
          payload.direction_bias = form.direction_bias || null;
          payload.entry_rules = form.entry_rules || null;
          payload.exit_rules = form.exit_rules || null;
        }
        const { data, error } = await supabase
          .from('strategies')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        return (data as { id: string }).id;
      } else {
        const { error } = await supabase
          .from('strategies')
          .update({
            name: form.name.trim(),
            description: form.description || null,
            instrument: form.instrument || null,
            timeframe: form.timeframe || null,
            direction_bias: form.direction_bias || null,
            entry_rules: form.entry_rules || null,
            exit_rules: form.exit_rules || null,
            notes: form.notes || null,
          })
          .eq('id', id!);
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      queryClient.invalidateQueries({ queryKey: ['strategy'] });
      toast({ title: 'Strategy saved' });
      if (isNew && newId) navigate(`/strategies/${newId}`, { replace: true });
    },
    onError: (err: Error) => {
      if (err.message === 'Name is required') {
        setNameError('Name is required');
      } else {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      toast({ title: 'Strategy deleted' });
      navigate('/strategies');
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    setNameError('');
    saveMutation.mutate();
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'name') setNameError('');
  };

  if (!isNew && isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isNew && !strategy) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Strategy not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/strategies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Strategies
        </Button>
      </div>
    );
  }

  const proField = (label: string, children: React.ReactNode) => {
    if (isNew && isFoundation) {
      return (
        <div className="space-y-2 opacity-50">
          <Label className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> {label}
          </Label>
          <p className="text-xs text-muted-foreground">Upgrade to Pro to unlock</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {children}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/strategies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          )}
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this strategy?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* System banner */}
      {isSystem && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 text-sm text-primary">
            This is a TradingGYM strategy. Create your own to customise the rules.
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            readOnly={readOnly}
            placeholder="Strategy name"
          />
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            readOnly={readOnly}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {proField(
            'Instrument',
            <Input
              value={form.instrument}
              onChange={(e) => updateField('instrument', e.target.value)}
              readOnly={readOnly}
              placeholder="e.g. MES, NQ, ES"
            />,
          )}
          {proField(
            'Timeframe',
            readOnly ? (
              <Input value={form.timeframe} readOnly />
            ) : (
              <Select value={form.timeframe} onValueChange={(v) => updateField('timeframe', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          )}
          {proField(
            'Direction Bias',
            readOnly ? (
              <Input value={form.direction_bias} readOnly />
            ) : (
              <Select value={form.direction_bias} onValueChange={(v) => updateField('direction_bias', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {['Long', 'Short', 'Both'].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          )}
        </div>

        {proField(
          'Entry Rules',
          <Textarea
            value={form.entry_rules}
            onChange={(e) => updateField('entry_rules', e.target.value)}
            readOnly={readOnly}
            rows={4}
            placeholder="Describe your entry conditions step by step"
          />,
        )}

        {proField(
          'Exit Rules',
          <Textarea
            value={form.exit_rules}
            onChange={(e) => updateField('exit_rules', e.target.value)}
            readOnly={readOnly}
            rows={4}
            placeholder="Describe your exit conditions and targets"
          />,
        )}

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            readOnly={readOnly}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
