import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const STEPS = [
  { name: 'Mark Opening Range', desc: 'Draw ORB High and ORB Low lines' },
  { name: 'Wait for Breakout', desc: 'Full candle body closes above or below' },
  { name: 'Wait for Retest', desc: 'Price returns to test the broken level' },
  { name: 'Confirm the Retest', desc: 'Candle wicks in but closes outside' },
  { name: 'Set Targets', desc: 'Stop at midpoint, target at 2:1 R:R' },
  { name: 'Execute & Review', desc: 'Enter trade and record the result' },
];

interface BlueprintChecklistProps {
  onStepsChange?: (checked: number[]) => void;
  resetKey?: number;
}

export default function BlueprintChecklist({ onStepsChange, resetKey }: BlueprintChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(Array(6).fill(false));

  useEffect(() => {
    setChecked(Array(6).fill(false));
  }, [resetKey]);

  const updateChecked = useCallback((newChecked: boolean[]) => {
    setChecked(newChecked);
    const nums = newChecked.map((v, i) => v ? i + 1 : 0).filter(Boolean);
    onStepsChange?.(nums);
  }, [onStepsChange]);

  const handleCheck = (index: number, value: boolean) => {
    const next = [...checked];
    if (value) {
      next[index] = true;
    } else {
      // Uncheck this and all subsequent
      for (let i = index; i < 6; i++) next[i] = false;
    }
    updateChecked(next);
  };

  const reset = () => updateChecked(Array(6).fill(false));

  const allComplete = checked.every(Boolean);

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
          <p className="text-xs text-muted-foreground mb-3">6-step execution checklist</p>

          <div className="flex flex-col gap-2.5">
            {STEPS.map((step, i) => {
              const locked = i > 0 && !checked[i - 1];
              return (
                <label
                  key={i}
                  className={`flex gap-2 items-start ${locked ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <Checkbox
                    checked={checked[i]}
                    disabled={locked}
                    onCheckedChange={(v) => handleCheck(i, !!v)}
                    className={checked[i] ? 'border-green-500 bg-green-500 text-white data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : ''}
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

          <button
            onClick={reset}
            className="mt-auto pt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      )}
    </div>
  );
}
