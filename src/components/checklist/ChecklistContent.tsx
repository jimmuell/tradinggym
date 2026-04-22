import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Pencil, Trash2, Plus, RotateCcw } from 'lucide-react';
import {
  useChecklistTemplates,
  useDeleteChecklistTemplate,
  useSaveChecklistTemplate,
  useSeedDefaultChecklists,
  type ChecklistItem,
  type ChecklistTemplate,
} from '@/hooks/useChecklistTemplates';
import {
  useCreateChecklistSession,
  useTodayChecklistSession,
  useUpdateChecklistSession,
} from '@/hooks/useChecklistSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Props = {
  mode: 'drawer' | 'companion';
  active?: boolean;
  onSitOut?: () => void;
  footerExtra?: React.ReactNode;
};

const isItemComplete = (item: ChecklistItem, value: unknown) => {
  if (item.type === 'toggle') return value === true;
  if (value === undefined || value === null) return false;
  return String(value).trim().length > 0;
};

export function ChecklistContent({ mode, active = true, onSitOut, footerExtra }: Props) {
  const { data: templates, isLoading: tplLoading } = useChecklistTemplates();
  const seed = useSeedDefaultChecklists();
  const { data: session } = useTodayChecklistSession();
  const createSession = useCreateChecklistSession();
  const updateSession = useUpdateChecklistSession();
  const saveTemplate = useSaveChecklistTemplate();
  const deleteTemplate = useDeleteChecklistTemplate();

  const [editing, setEditing] = useState(false);
  const [confirmDeleteCore, setConfirmDeleteCore] = useState<{
    section: 'prep' | 'exec';
    itemId: string;
  } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (active && templates && templates.length === 0 && !seed.isPending) {
      seed.mutate();
    }
  }, [active, templates, seed]);

  useEffect(() => {
    if (session?.template_id) {
      setSelectedTemplateId(session.template_id);
    } else if (templates && templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [session, templates, selectedTemplateId]);

  const activeTemplate: ChecklistTemplate | undefined = useMemo(() => {
    if (!templates) return undefined;
    return templates.find((t) => t.id === selectedTemplateId) ?? templates[0];
  }, [templates, selectedTemplateId]);

  const prepValues = session?.session_prep_completed ?? {};
  const execValues = session?.execution_completed ?? {};

  const allPrepDone =
    activeTemplate?.session_prep_items.every((i) => isItemComplete(i, prepValues[i.id])) ?? false;
  const allExecDone =
    activeTemplate?.execution_items.every((i) => isItemComplete(i, execValues[i.id])) ?? false;

  const ensureSession = async () => {
    if (session || !activeTemplate) return session;
    const created = await createSession.mutateAsync({
      templateId: activeTemplate.id,
      strategyName: activeTemplate.strategy_name,
    });
    return created;
  };

  const updatePrep = async (
    itemId: string,
    value: string | boolean | number,
    item: ChecklistItem,
  ) => {
    const s = await ensureSession();
    if (!s) return;
    const next = { ...(s.session_prep_completed ?? {}), [itemId]: value };
    const patch: Record<string, unknown> = { session_prep_completed: next };
    if (item.id === 'sp-1' && item.input_type === 'currency') {
      const num = Number(value);
      patch.max_daily_loss = Number.isFinite(num) ? num : null;
    }
    if (item.id === 'sp-2') patch.trading_session = String(value);
    if (item.id === 'sp-3') patch.htf_bias = String(value);
    if (item.id === 'sp-4') patch.emotional_readiness = value === true;
    updateSession.mutate({ id: s.id, patch });
  };

  const updateExec = async (itemId: string, value: string | boolean | number) => {
    const s = await ensureSession();
    if (!s) return;
    const next = { ...(s.execution_completed ?? {}), [itemId]: value };
    updateSession.mutate({ id: s.id, patch: { execution_completed: next } });
  };

  const resetExecution = () => {
    if (!session) return;
    updateSession.mutate({ id: session.id, patch: { execution_completed: {} } });
  };

  const removeItem = (section: 'prep' | 'exec', itemId: string) => {
    if (!activeTemplate) return;
    const key = section === 'prep' ? 'session_prep_items' : 'execution_items';
    const items = (activeTemplate[key] as ChecklistItem[]).filter((i) => i.id !== itemId);
    saveTemplate.mutate({
      id: activeTemplate.id,
      strategy_name: activeTemplate.strategy_name,
      session_prep_items:
        section === 'prep' ? items : activeTemplate.session_prep_items,
      execution_items:
        section === 'exec' ? items : activeTemplate.execution_items,
    });
  };

  const handleDeleteItem = (section: 'prep' | 'exec', item: ChecklistItem) => {
    if (item.is_core) {
      setConfirmDeleteCore({ section, itemId: item.id });
    } else {
      removeItem(section, item.id);
    }
  };

  const updateItemLabel = (section: 'prep' | 'exec', itemId: string, label: string) => {
    if (!activeTemplate) return;
    const key = section === 'prep' ? 'session_prep_items' : 'execution_items';
    const items = (activeTemplate[key] as ChecklistItem[]).map((i) =>
      i.id === itemId ? { ...i, label } : i,
    );
    saveTemplate.mutate({
      id: activeTemplate.id,
      strategy_name: activeTemplate.strategy_name,
      session_prep_items:
        section === 'prep' ? items : activeTemplate.session_prep_items,
      execution_items:
        section === 'exec' ? items : activeTemplate.execution_items,
    });
  };

  const addItem = (section: 'prep' | 'exec') => {
    if (!activeTemplate) return;
    const key = section === 'prep' ? 'session_prep_items' : 'execution_items';
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      label: 'New step',
      type: 'toggle',
      is_core: false,
    };
    const items = [...(activeTemplate[key] as ChecklistItem[]), newItem];
    saveTemplate.mutate({
      id: activeTemplate.id,
      strategy_name: activeTemplate.strategy_name,
      session_prep_items:
        section === 'prep' ? items : activeTemplate.session_prep_items,
      execution_items:
        section === 'exec' ? items : activeTemplate.execution_items,
    });
  };

  const resetToDefault = async () => {
    if (!activeTemplate) return;
    const defaults = (templates ?? []).filter((t) => t.is_default);
    await Promise.all(defaults.map((t) => deleteTemplate.mutateAsync(t.id)));
    await seed.mutateAsync();
  };

  const emotionalReadiness = session?.emotional_readiness !== false;

  return (
    <div className="flex flex-col h-full">
      <div className={cn('flex-1 overflow-y-auto space-y-6', mode === 'drawer' ? 'p-4' : 'p-1')}>
        {tplLoading || !templates ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {/* Strategy selector */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Strategy
              </Label>
              <Select
                value={activeTemplate?.id}
                onValueChange={(v) => setSelectedTemplateId(v)}
                disabled={!!session}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.strategy_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {session && (
                <p className="text-xs text-muted-foreground">Locked for today's session</p>
              )}
            </div>

            {/* Section 1 — Session Prep */}
            {activeTemplate && (
              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    Session Prep
                    {allPrepDone && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </h3>
                  <p className="text-xs text-muted-foreground">Complete once per trading day</p>
                </div>

                <div className="space-y-3">
                  {activeTemplate.session_prep_items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      value={prepValues[item.id]}
                      onChange={(v) => updatePrep(item.id, v, item)}
                      editing={editing}
                      onLabelChange={(l) => updateItemLabel('prep', item.id, l)}
                      onDelete={() => handleDeleteItem('prep', item)}
                    />
                  ))}
                  {editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addItem('prep')}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </Button>
                  )}
                </div>

                {!emotionalReadiness && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs">
                        You've indicated you're not in the right headspace. Traders who proceed
                        in this state lose significantly more often.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="default" onClick={onSitOut}>
                        I'll sit this one out
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          session &&
                          updateSession.mutate({
                            id: session.id,
                            patch: { emotional_readiness: false },
                          })
                        }
                      >
                        Trade anyway
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Section 2 — Trade Execution */}
            {activeTemplate && allPrepDone && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      Trade Execution
                      {allExecDone && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Complete before each trade entry
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetExecution}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                </div>

                <div className="space-y-3">
                  {activeTemplate.execution_items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      value={execValues[item.id]}
                      onChange={(v) => updateExec(item.id, v)}
                      editing={editing}
                      onLabelChange={(l) => updateItemLabel('exec', item.id, l)}
                      onDelete={() => handleDeleteItem('exec', item)}
                    />
                  ))}
                  {editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addItem('exec')}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </Button>
                  )}
                </div>

                {allExecDone && (
                  <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    All clear — execute your trade
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <footer
        className={cn(
          'border-t border-border flex items-center justify-between gap-2 shrink-0 flex-wrap',
          mode === 'drawer' ? 'p-3' : 'pt-3 mt-3',
        )}
      >
        <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? 'Done editing' : 'Edit checklist'}
        </Button>
        <div className="flex items-center gap-2">
          {editing && (
            <Button variant="ghost" size="sm" onClick={resetToDefault}>
              Reset to default
            </Button>
          )}
          {footerExtra}
        </div>
      </footer>

      <AlertDialog
        open={!!confirmDeleteCore}
        onOpenChange={(o) => !o && setConfirmDeleteCore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove core step?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a core step from the {activeTemplate?.strategy_name} blueprint. Removing
              it may reduce your trading accuracy. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteCore) {
                  removeItem(confirmDeleteCore.section, confirmDeleteCore.itemId);
                  setConfirmDeleteCore(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type RowProps = {
  item: ChecklistItem;
  value: unknown;
  onChange: (v: string | boolean | number) => void;
  editing: boolean;
  onLabelChange: (label: string) => void;
  onDelete: () => void;
};

function ItemRow({ item, value, onChange, editing, onLabelChange, onDelete }: RowProps) {
  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border p-2">
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          defaultValue={item.label}
          onBlur={(e) => {
            if (e.target.value !== item.label) onLabelChange(e.target.value);
          }}
          className="h-8 text-sm"
        />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    );
  }

  if (item.type === 'toggle') {
    return (
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={value === true}
          onCheckedChange={(v) => onChange(v === true)}
          className="mt-0.5"
        />
        <span className="text-sm leading-snug">{item.label}</span>
      </label>
    );
  }

  if (item.type === 'select') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{item.label}</Label>
        <Select
          value={typeof value === 'string' ? value : undefined}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {item.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{item.label}</Label>
      <div className="relative">
        {item.input_type === 'currency' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
        )}
        <Input
          type={item.input_type === 'currency' ? 'number' : 'text'}
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn('h-9', item.input_type === 'currency' && 'pl-6')}
        />
      </div>
    </div>
  );
}
