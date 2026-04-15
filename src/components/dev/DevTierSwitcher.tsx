import { useTier, TierState } from '@/contexts/TierContext';
import { useState, useRef, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useRef, useCallback } from 'react';

const TIERS: { label: string; value: TierState }[] = [
  { label: 'Foundation', value: 'foundation' },
  { label: 'Tier 1', value: 'tier1' },
  { label: 'Tier 2', value: 'tier2' },
  { label: 'Tier 3', value: 'tier3' },
  { label: 'Coach', value: 'coach' },
];

function DevTierSwitcherInner() {
  const { currentTier, setTierState } = useTier();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const didDrag = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag from the container/badge, not buttons
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
      className="bg-slate-900 border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2 text-xs shadow-lg"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-blue-400 font-bold mr-1 select-none">DEV</span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Development only — switches tier state for testing. Not visible in production.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {TIERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => { if (!didDrag.current) setTierState(value); }}
          className={
            currentTier === value
              ? 'bg-blue-600 text-white px-3 py-1 rounded-full font-medium'
              : 'text-slate-400 px-3 py-1 rounded-full hover:text-white hover:bg-slate-700 cursor-pointer'
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function DevTierSwitcher() {
  if (!import.meta.env.DEV) return null;
  return <DevTierSwitcherInner />;
}
