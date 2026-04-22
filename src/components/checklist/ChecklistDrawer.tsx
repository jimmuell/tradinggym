import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChecklistContent } from './ChecklistContent';
import { cn } from '@/lib/utils';

type Props = { open: boolean; onClose: () => void };

export function ChecklistDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const openCompanion = () => {
    window.open('/companion', 'tradingym-companion', 'width=360,height=800');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full sm:w-[380px] bg-background border-l border-border shadow-xl transition-transform duration-300 flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold">Pre-Trade Checklist</h2>
            <p className="text-xs text-muted-foreground">Daily session prep & execution</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 min-h-0 flex flex-col">
          <ChecklistContent
            mode="drawer"
            active={open}
            onSitOut={onClose}
            footerExtra={
              <Button variant="ghost" size="sm" onClick={openCompanion}>
                <ExternalLink className="h-3.5 w-3.5" /> Companion mode
              </Button>
            }
          />
        </div>
      </aside>
    </>
  );
}
