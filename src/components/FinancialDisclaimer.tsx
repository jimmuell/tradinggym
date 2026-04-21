import { AlertTriangle } from 'lucide-react';

export default function FinancialDisclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="leading-relaxed">
        <span className="font-semibold">For educational and simulation purposes only.</span>{' '}
        Not financial advice. No real money is at risk. Past simulated performance does not guarantee future results.
        Trading futures involves substantial risk of loss.
      </p>
    </div>
  );
}
