import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TERMS_SECTIONS, PRIVACY_SECTIONS, LEGAL_LAST_UPDATED } from '@/lib/legalContent';

interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'terms' | 'privacy';
}

export default function LegalModal({ open, onOpenChange, type }: LegalModalProps) {
  const isTerms = type === 'terms';
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollHeight > el.clientHeight + 1;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 20;
    setShowIndicator(overflows && !atBottom);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Defer until content is rendered
    const raf = requestAnimationFrame(checkScroll);
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      cancelAnimationFrame(raf);
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [open, type, checkScroll]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Last updated: {LEGAL_LAST_UPDATED}</DialogDescription>
        </DialogHeader>
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            className="overflow-y-auto scrollbar-hide pr-2 h-full space-y-5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {sections.map((s, i) => (
              <section key={s.title}>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {i + 1}. {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </section>
            ))}
            <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
          </div>
          {showIndicator && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-2 text-[11px] text-muted-foreground/50 tracking-wide">
              <ChevronDown className="h-3 w-3 animate-bounce" />
              Scroll for more
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
