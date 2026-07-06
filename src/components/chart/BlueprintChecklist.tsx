import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlaybackPhase, PLAYBACK_PHASES } from '@/lib/playbackTypes';

const STEPS = [
  { name: 'Mark Opening Range', desc: 'Draw ORB High and ORB Low lines' },
  { name: 'Wait for Breakout', desc: 'Full candle body closes above or below' },
  { name: 'Wait for Retest', desc: 'Price returns to test the broken level' },
  { name: 'Confirm the Retest', desc: 'Candle wicks in but closes outside' },
  { name: 'Set Targets', desc: 'Stop at midpoint, target at 2:1 R:R' },
  { name: 'Execute & Review', desc: 'Enter trade and record the result' },
];

const STEP_PHASE: PlaybackPhase[] = [
  'setup',
  'confirmation',
  'confirmation',
  'confirmation',
  'entry',
  'exit',
];

interface BlueprintChecklistProps {
  onStepsChange?: (checked: number[]) => void;
  resetKey?: number;
  mode?: 'manual' | 'guided';
  currentPhase?: PlaybackPhase;
  showMe?: boolean;
  onShowMeChange?: (v: boolean) => void;
}

export default function BlueprintChecklist({
  onStepsChange,
  resetKey,
  mode = 'manual',
  currentPhase,
  showMe = false,
  onShowMeChange,
}: BlueprintChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(Array(6).fill(false));

  const isDerived = mode === 'guided' || showMe;

  const derived = useMemo<boolean[]>(() => {
    if (!isDerived || !currentPhase) return Array(6).fill(false);
    const curIdx = PLAYBACK_PHASES.indexOf(currentPhase);
    return STEP_PHASE.map((p) => curIdx >= PLAYBACK_PHASES.indexOf(p));
  }, [isDerived, currentPhase]);

  const effective = isDerived ? derived : checked;

  useEffect(() => {
    setChecked(Array(6).fill(false));
  }, [resetKey]);

  // Emit steps to parent for both branches
  useEffect(() => {
    const nums = effective.map((v, i) => (v ? i + 1 : 0)).filter(Boolean);
    onStepsChange?.(nums);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective.join(',')]);

  const handleCheck = (index: number, value: boolean) => {
    if (isDerived) return;
    const next = [...checked];
    if (value) {
      next[index] = true;
    } else {
      for (let i = index; i < 6; i++) next[i] = false;
    }
    setChecked(next);
  };

  const reset = () => {
    setChecked(Array(6).fill(false));
    onShowMeChange?.(false);
  };

  const allComplete = effective.every(Boolean);
  const showToggle = currentPhase !== undefined && mode !== 'guided';

  return (
    <div className={`flex flex-col border-l border-border bg-card shrink-0 transition-all ${collapsed ? 'w-[32px]' : 'w-[220px]'}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 mx-auto mt-2 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Show or hide the ORB step checklist</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {!collapsed && (
        <div className="flex flex-col flex-1 px-3 pb-3 overflow-y-auto">
          <p className="text-sm font-medium text-foreground mt-2">ORB Blueprint</p>
          <p className="text-xs text-muted-foreground mb-2">6-step execution checklist</p>

          {showToggle && (
            <label className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-accent/40 cursor-pointer">
              <Checkbox
                checked={showMe}
                onCheckedChange={(v) => onShowMeChange?.(!!v)}
              />
              <span className="text-xs text-foreground">Show me</span>
            </label>
          )}

          {mode === 'guided' && (
            <div className="mb-3 px-2 py-1.5 rounded bg-primary/10 text-[11px] text-primary">
              Guided playback — steps auto-check
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => {
              const locked = i > 0 && !effective[i - 1];
              const disabled = isDerived || locked;
              return (
                <label
                  key={i}
                  className={`flex gap-2 items-start ${locked ? 'opacity-40' : ''} ${disabled ? 'pointer-events-none' : ''}`}
                >
                  <Checkbox
                    checked={effective[i]}
                    disabled={disabled}
                    onCheckedChange={(v) => handleCheck(i, !!v)}
                    className={effective[i] ? 'border-green-500 bg-green-500 text-white data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground leading-tight">
                      {i + 1}. {step.name}
                    </span>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">{step.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {allComplete && (
            <div className="mt-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-500">Blueprint Complete</p>
                <p className="text-xs text-muted-foreground">Ready to execute your trade</p>
              </div>
            </div>
          )}

          {!isDerived && (
            <button
              onClick={reset}
              className="mt-auto pt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
