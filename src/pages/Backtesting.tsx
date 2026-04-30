import { Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Backtesting() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-16">
      <div className="max-w-xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Beaker className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Backtesting Coming Soon
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Run your strategies against 18 years of historical MES/ES data. Validate
          your edge with real market conditions before risking capital.
        </p>
        <div className="pt-2">
          <Button
            size="lg"
            onClick={() =>
              toast("We'll let you know when backtesting is available!")
            }
          >
            Notify Me
          </Button>
        </div>
      </div>
    </div>
  );
}
