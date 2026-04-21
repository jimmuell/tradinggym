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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Last updated: {LEGAL_LAST_UPDATED}</DialogDescription>
        </DialogHeader>
        <div
          className="overflow-y-auto scrollbar-hide pr-2 flex-1 space-y-5 relative"
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
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
