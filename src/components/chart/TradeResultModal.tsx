import { useEffect, useRef } from 'react';
import { X, Trophy, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface TradeResult {
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlTicks: number;
  result: 'win' | 'loss';
  reason: 'tp' | 'sl';
}

interface TradeResultModalProps {
  result: TradeResult;
  onClose: () => void;
}

const winMessages = [
  "Great trade! You nailed the entry! 🎯",
  "Profit locked in! Keep up the momentum! 💪",
  "That's how it's done! Textbook execution! 📈",
  "Winner winner! Your patience paid off! 🏆",
  "Excellent read on the market! 🔥",
];

const lossMessages = [
  "Every pro has losses — it's part of the game. 💪",
  "Risk managed perfectly. SL did its job. 🛡️",
  "One trade doesn't define you. Stay disciplined. 🧘",
  "Smart traders lose small. You did exactly that. ✅",
  "The best traders lose gracefully. On to the next! 🚀",
];

export default function TradeResultModal({ result, onClose }: TradeResultModalProps) {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (result.result === 'win' && !confettiFired.current) {
      confettiFired.current = true;
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#26a69a', '#4caf50', '#66bb6a', '#ffd700'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#26a69a', '#4caf50', '#66bb6a', '#ffd700'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [result.result]);

  const isWin = result.result === 'win';
  const message = isWin
    ? winMessages[Math.floor(Math.random() * winMessages.length)]
    : lossMessages[Math.floor(Math.random() * lossMessages.length)];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`relative w-[380px] rounded-2xl border shadow-2xl overflow-hidden ${
        isWin
          ? 'bg-gradient-to-b from-[#1a2e1a] to-[#1e222d] border-[#26a69a]/30'
          : 'bg-gradient-to-b from-[#2e1a1a] to-[#1e222d] border-[#ef5350]/30'
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isWin
              ? 'bg-[#26a69a]/20 text-[#26a69a]'
              : 'bg-[#ef5350]/20 text-[#ef5350]'
          }`}>
            {isWin ? <Trophy size={40} /> : <ShieldAlert size={40} />}
          </div>
        </div>

        {/* Title */}
        <div className="text-center px-6">
          <h2 className={`text-2xl font-bold ${isWin ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
            {isWin ? 'Trade Won!' : 'Trade Closed'}
          </h2>
          <p className="text-foreground text-sm mt-2 leading-relaxed">{message}</p>
        </div>

        {/* Trade details */}
        <div className="mx-6 mt-6 rounded-xl bg-background border border-border p-4 space-y-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Side</span>
            <span className={`font-semibold ${result.side === 'long' ? 'text-[#2962ff]' : 'text-[#ef5350]'}`}>
              {result.side === 'long' ? '▲ Long' : '▼ Short'}
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Entry</span>
            <span className="text-foreground font-medium">{result.entryPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Exit ({result.reason === 'tp' ? 'Take Profit' : 'Stop Loss'})</span>
            <span className="text-foreground font-medium">{result.exitPrice.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between text-[14px]">
            <span className="text-muted-foreground font-medium">P&L</span>
            <span className={`font-bold text-lg ${isWin ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {isWin ? '+' : ''}{result.pnlTicks} ticks / {isWin ? '+' : ''}${Math.abs(result.pnl).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="px-6 pt-5 pb-6">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-lg font-semibold text-white text-base transition-colors ${
              isWin
                ? 'bg-[#26a69a] hover:bg-[#2bbd9a]'
                : 'bg-[#2962ff] hover:bg-[#1e53e5]'
            }`}
          >
            {isWin ? 'Keep Trading! 🚀' : 'Try Again 💪'}
          </button>
        </div>
      </div>
    </div>
  );
}
