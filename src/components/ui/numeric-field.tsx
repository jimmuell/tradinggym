import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface NumericFieldProps {
  id?: string;
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** When true, allows fractional input (text + inputMode="decimal"). */
  decimal?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared controlled numeric input.
 *
 * - Holds a STRING draft while editing (no mid-edit coercion), so users can
 *   type "1.", ".5", "1.24" without the value being rewritten under them.
 * - Coerces to a number ONLY on blur, Enter, or stepper click.
 * - Custom up/down steppers respect `step` (e.g. 0.01, 0.25, 1) and `min`.
 * - Decimal mode uses type="text" + inputMode="decimal" to avoid the
 *   <input type="number"> "1." → "" quirk.
 */
export function NumericField({
  id,
  value,
  onCommit,
  min,
  max,
  step = 1,
  decimal = false,
  disabled,
  className,
}: NumericFieldProps) {
  const [draft, setDraft] = useState<string>(() => formatNum(value, decimal));
  const focusedRef = useRef(false);

  // Sync from external value changes only when not actively editing.
  useEffect(() => {
    if (!focusedRef.current) setDraft(formatNum(value, decimal));
  }, [value, decimal]);

  const clamp = (n: number): number => {
    let v = Number.isFinite(n) ? n : (min ?? 0);
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    if (!decimal) v = Math.trunc(v);
    return v;
  };

  const commit = (s: string) => {
    const parsed = parseFloat(s);
    const safe = clamp(Number.isFinite(parsed) ? parsed : (min ?? 0));
    onCommit(safe);
    setDraft(formatNum(safe, decimal));
  };

  const allow = decimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;

  const bump = (dir: 1 | -1) => {
    const base = Number.isFinite(parseFloat(draft)) ? parseFloat(draft) : (value ?? 0);
    const next = clamp(roundStep(base + dir * step, step, decimal));
    onCommit(next);
    setDraft(formatNum(next, decimal));
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={draft}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          commit(e.target.value);
        }}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || allow.test(v)) setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            bump(1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            bump(-1);
          } else if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="pr-7 tabular-nums"
      />
      <div className="pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 flex-col">
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(1)}
          aria-label="Increment"
          className="pointer-events-auto flex h-4 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(-1)}
          aria-label="Decrement"
          className="pointer-events-auto flex h-4 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function formatNum(n: number | null | undefined, decimal: boolean): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  if (!Number.isFinite(n)) return '';
  return decimal ? String(n) : String(Math.trunc(n));
}

function roundStep(n: number, step: number, decimal: boolean): number {
  if (!decimal) return Math.round(n);
  const inv = 1 / step;
  return Math.round(n * inv) / inv;
}
