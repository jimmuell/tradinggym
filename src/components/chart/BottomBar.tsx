import { useState } from 'react';
import { Star, ChevronUp, Maximize2 } from 'lucide-react';
import DateRangeModal from './DateRangeModal';

const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];
const tradingTabs = ['Strategy Report', 'Paper Trading', 'Trade'];

const accountStats = [
  { label: 'Account balance', value: '1,000,000.00' },
  { label: 'Equity', value: '1,000,000.00' },
  { label: 'Realized P&L', value: '0.00' },
  { label: 'Unrealized P&L', value: '0.00' },
  { label: 'Account margin', value: '0.00' },
  { label: 'Available funds', value: '1,000,000.00' },
  { label: 'Orders margin', value: '0.00' },
  { label: 'Margin buffer', value: '100%' },
];

export default function BottomBar() {
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Paper Trading');

  return (
    <>
      <DateRangeModal open={dateModalOpen} onClose={() => setDateModalOpen(false)} />
      {/* Row 1: Timeframe bar */}
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
      {/* Row 2: Trading info bar */}
      <div className="flex items-center h-[26px] bg-[#1e222d] border-t border-[#2a2e39] px-2 text-[10px] text-[#787b86]">
        <div className="flex items-center gap-0.5">
          {tradingTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 rounded ${tab === activeTab ? 'text-[#d1d4dc] bg-[#2a2e39]' : 'hover:text-[#d1d4dc] hover:bg-[#2a2e39]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-[#2a2e39] mx-2" />
        <div className="flex items-center gap-3 overflow-x-auto">
          {accountStats.map(({ label, value }) => (
            <span key={label} className="whitespace-nowrap">
              <span className="text-[#787b86]">{label}: </span>
              <span className="text-[#d1d4dc]">{value}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
