import { HelpCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface HelpSheetProps {
  pageName: string;
}

export default function HelpSheet({ pageName }: HelpSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground">
          <HelpCircle size={16} />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{pageName} Help</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Help content for this section is coming soon. Check back after the next update.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
