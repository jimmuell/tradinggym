import { useState } from 'react';
import { Info, X } from 'lucide-react';

const STORAGE_KEY = 'tg-simulator-hint-seen';

export default function SimulatorHintBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 text-sm">
      <Info size={16} className="text-blue-400 shrink-0" />
      <p className="flex-1 text-blue-200">
        Welcome to the TradingGYM Simulator. Use Replay mode to practice on historical data. Press H to draw levels, then place your trade.
      </p>
      <button onClick={dismiss} className="text-blue-400 hover:text-blue-300 shrink-0 p-1">
        <X size={14} />
      </button>
    </div>
  );
}
