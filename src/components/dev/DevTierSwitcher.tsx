import { useTier, TierState, PlanState } from '@/contexts/TierContext';
import { useState, useRef, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TIERS: { label: string; value: TierState }[] = [
  { label: 'Foundation', value: 'foundation' },
  { label: 'Tier 1', value: 'tier1' },
  { label: 'Tier 2', value: 'tier2' },
  { label: 'Tier 3', value: 'tier3' },
  { label: 'Coach', value: 'coach' },
];

const PLANS: { label: string; value: PlanState }[] = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Expert', value: 'expert' },
  { label: 'Guru', value: 'guru' },
];

function DevTierSwitcherInner() {
  const { currentTier, planState, setTierState, setPlanState } = useTier();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const didDrag = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    didDrag.current = false;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY - dy });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const activeBtn = 'bg-blue-600 text-white px-3 py-1 rounded-full font-medium';
  const inactiveBtn = 'text-slate-400 px-3 py-1 rounded-full hover:text-white hover:bg-slate-700 cursor-pointer';
  const labelCls = 'text-blue-400 font-bold text-[10px] tracking-wider w-16 select-none';

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'fixed',
        bottom: `calc(1rem + ${pos.y}px)`,
        left: `calc(50% + ${pos.x}px)`,
        transform: 'translateX(-50%)',
        zIndex: 50,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2 flex flex-col gap-1.5 text-xs shadow-lg"
    >
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={labelCls}>DEV</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Development only — switches plan/tier state for testing. Not visible in production.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-slate-500 text-[10px]">PLAN &amp; LEARNING (independent)</span>
      </div>

      <div className="flex items-center gap-1">
        <span className={labelCls}>PLAN</span>
        {PLANS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { if (!didDrag.current) setPlanState(value); }}
            className={planState === value ? activeBtn : inactiveBtn}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <span className={labelCls}>LEARNING</span>
        {TIERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { if (!didDrag.current) setTierState(value); }}
            className={currentTier === value ? activeBtn : inactiveBtn}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DevTierSwitcher() {
  if (!import.meta.env.DEV) return null;
  return <DevTierSwitcherInner />;
}
