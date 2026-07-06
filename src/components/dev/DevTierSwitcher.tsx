import { useTier, TierState } from '@/contexts/TierContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GripHorizontal, ChevronsRightLeft } from 'lucide-react';
import { getTierDisplayName } from '@/lib/tierUtils';

const TIERS: { value: TierState }[] = [
  { value: 'foundation' },
  { value: 'tier1' },
  { value: 'tier2' },
  { value: 'tier3' },
  { value: 'coach' },
];

const STORAGE_KEY = 'dev-tier-switcher-position';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const COLLAPSED_KEY = 'dev-tier-switcher-collapsed';

function DevTierSwitcherInner() {
  const { currentTier, setTierState } = useTier();
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });
  const dragStateRef = useRef<{ offsetX: number; offsetY: number; moved: boolean } | null>(null);

  // Restore from localStorage on mount; otherwise default to bottom-center.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { x: number; y: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPos(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    const el = panelRef.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    setPos({
      x: Math.max(8, window.innerWidth / 2 - w / 2),
      y: Math.max(8, window.innerHeight - h - 16),
    });
  }, []);

  const clampToViewport = useCallback((x: number, y: number) => {
    const el = panelRef.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    return {
      x: clamp(x, 0, Math.max(0, window.innerWidth - w)),
      y: clamp(y, 0, Math.max(0, window.innerHeight - h)),
    };
  }, []);

  // Keep within viewport on resize.
  useEffect(() => {
    const onResize = () => {
      setPos((p) => (p ? clampToViewport(p.x, p.y) : p));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToViewport]);

  // Persist position.
  useEffect(() => {
    if (!pos) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }, [pos]);

  const beginDrag = useCallback((clientX: number, clientY: number) => {
    if (!pos) return;
    dragStateRef.current = {
      offsetX: clientX - pos.x,
      offsetY: clientY - pos.y,
    };
    setDragging(true);
  }, [pos]);

  // Mouse + touch listeners on document while dragging.
  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const s = dragStateRef.current;
      if (!s) return;
      setPos(clampToViewport(e.clientX - s.offsetX, e.clientY - s.offsetY));
    };
    const onMouseUp = () => {
      dragStateRef.current = null;
      setDragging(false);
    };
    const onTouchMove = (e: TouchEvent) => {
      const s = dragStateRef.current;
      if (!s || e.touches.length === 0) return;
      e.preventDefault();
      const t = e.touches[0];
      setPos(clampToViewport(t.clientX - s.offsetX, t.clientY - s.offsetY));
    };
    const onTouchEnd = () => {
      dragStateRef.current = null;
      setDragging(false);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [dragging, clampToViewport]);

  const onHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    beginDrag(e.clientX, e.clientY);
  };

  const onHandleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    beginDrag(t.clientX, t.clientY);
  };

  const activeBtn = 'bg-blue-600 text-white px-3 py-1 rounded-full font-medium';
  const inactiveBtn = 'text-slate-400 px-3 py-1 rounded-full hover:text-white hover:bg-slate-700 cursor-pointer';
  const labelCls = 'text-blue-400 font-bold text-[10px] tracking-wider w-16 select-none';

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: pos ? `${pos.y}px` : undefined,
        left: pos ? `${pos.x}px` : undefined,
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 50,
        userSelect: 'none',
      }}
      className="bg-slate-900 border border-slate-700 rounded-2xl px-4 pt-1 pb-2 flex flex-col gap-1.5 text-xs shadow-lg"
    >
      {/* Drag handle: header area */}
      <div
        onMouseDown={onHandleMouseDown}
        onTouchStart={onHandleTouchStart}
        style={{
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        className="flex flex-col items-stretch -mx-4 px-4 pt-1"
      >
        <div className="flex justify-center text-slate-600 hover:text-slate-400 transition-colors">
          <GripHorizontal className="h-3 w-3" />
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={labelCls}>DEV</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Development only — switches learning tier for testing. Not visible in production.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-slate-500 text-[10px]">LEARNING TIER (dev only)</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className={labelCls}>LEARNING</span>
        {TIERS.map(({ value }) => (
          <button
            key={value}
            onClick={() => setTierState(value)}
            className={currentTier === value ? activeBtn : inactiveBtn}
          >
            {getTierDisplayName(value)}
          </button>
        ))}
      </div>
    </div>
  );
}

const DEV_MENU_KEY = 'dev-menu-visible';

function getStoredDevMenu(): boolean {
  try {
    return localStorage.getItem(DEV_MENU_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function DevTierSwitcher() {
  const [visible, setVisible] = useState<boolean>(getStoredDevMenu);

  useEffect(() => {
    const sync = () => setVisible(getStoredDevMenu());
    window.addEventListener('storage', sync);
    window.addEventListener('dev-menu-visibility-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('dev-menu-visibility-change', sync);
    };
  }, []);

  if (!visible) return null;
  return <DevTierSwitcherInner />;
}
