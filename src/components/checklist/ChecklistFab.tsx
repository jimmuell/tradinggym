import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTodayChecklistSession } from '@/hooks/useChecklistSession';
import { useChecklistTemplates } from '@/hooks/useChecklistTemplates';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChecklistDrawer } from './ChecklistDrawer';
import { cn } from '@/lib/utils';

const HIDDEN_PATHS = ['/', '/auth', '/companion', '/terms', '/privacy'];

export function ChecklistFab() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: session } = useTodayChecklistSession();
  const { data: templates } = useChecklistTemplates();

  const hide =
    !user ||
    HIDDEN_PATHS.includes(location.pathname) ||
    location.pathname.startsWith('/companion');

  const { percent, prepDone, execDone } = useMemo(() => {
    if (!session || !templates) return { percent: 0, prepDone: false, execDone: false };
    const tpl = templates.find((t) => t.id === session.template_id);
    if (!tpl) return { percent: 0, prepDone: false, execDone: false };
    const prepIds = tpl.session_prep_items.map((i) => i.id);
    const execIds = tpl.execution_items.map((i) => i.id);
    const prepDoneCount = prepIds.filter((id) => {
      const v = session.session_prep_completed?.[id];
      return v !== undefined && v !== null && v !== '' && v !== false;
    }).length;
    const execDoneCount = execIds.filter((id) => {
      const v = session.execution_completed?.[id];
      return v !== undefined && v !== null && v !== '' && v !== false;
    }).length;
    const total = prepIds.length + execIds.length;
    return {
      percent: total === 0 ? 0 : Math.round(((prepDoneCount + execDoneCount) / total) * 100),
      prepDone: prepIds.length > 0 && prepDoneCount === prepIds.length,
      execDone: execIds.length > 0 && execDoneCount === execIds.length,
    };
  }, [session, templates]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (hide) return null;

  const hasSession = !!session;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const ringColor = !hasSession
    ? 'stroke-transparent'
    : execDone && prepDone
      ? 'stroke-emerald-500'
      : 'stroke-amber-500';

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Pre-trade checklist"
            onClick={() => setOpen(true)}
            className={cn(
              'fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-transform',
              !hasSession && 'animate-checklist-pulse',
            )}
          >
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 56 56"
              width="56"
              height="56"
            >
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                strokeWidth="3"
                className="stroke-primary-foreground/20"
              />
              {hasSession && (
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className={cn('transition-all duration-300', ringColor)}
                />
              )}
            </svg>
            <ClipboardCheck className="h-6 w-6 relative" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {hasSession ? `${percent}% complete` : 'Pre-trade checklist'}
        </TooltipContent>
      </Tooltip>

      <ChecklistDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
