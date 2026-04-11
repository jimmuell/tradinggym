import { useState } from 'react';
import { Star, ChevronUp, Maximize2 } from 'lucide-react';
import DateRangeModal from './DateRangeModal';

const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'All'];

export default function BottomBar() {
  const [dateModalOpen, setDateModalOpen] = useState(false);

  return (
    <>
    <DateRangeModal open={dateModalOpen} onClose={() => setDateModalOpen(false)} />
    <div className="flex items-center h-[26px] bg-[#1e222d] border-t border-[#2a2e39] px-2 text-[10px] text-[#787b86]">
      <button className="p-1 hover:text-[#d1d4dc]"><Star size={14} /></button>
      <div className="flex items-center gap-0.5 ml-2">
        {timeframes.map((tf) => (
          <button
            key={tf}
            className="px-1.5 py-0.5 rounded hover:bg-[#2a2e39] hover:text-[#d1d4dc]"
          >
            {tf}
          </button>
        ))}
        <button onClick={() => setDateModalOpen(true)} className="px-1.5 py-0.5 rounded hover:bg-[#2a2e39]">📅</button>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span>12:18:37 UTC-5</span>
        <span>ETH</span>
      </div>
      <div className="w-px h-4 bg-[#2a2e39] mx-2" />
      <div className="flex items-center gap-2">
        <span className="text-[#2962ff] font-medium flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 40 28"><path d="M8 0h24L40 28H0z" fill="#2962ff"/></svg>
          Paper Trading
        </span>
        <span className="hover:text-[#d1d4dc] cursor-pointer">Trade</span>
      </div>
      <div className="flex-1" />
      <button className="p-1 hover:text-[#d1d4dc]"><ChevronUp size={14} /></button>
      <button className="p-1 hover:text-[#d1d4dc]"><Maximize2 size={14} /></button>
    </div>
    </>
  );
}
