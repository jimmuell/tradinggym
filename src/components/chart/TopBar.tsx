import {
  Search, Plus, ChevronDown, BarChart3, Bell, Rewind,
  Undo, Redo, Ruler, Square, PenTool, Eye, Settings,
  Layout, Camera, Bookmark
} from 'lucide-react';

interface TopBarProps {
  ohlcv: { open: number; high: number; low: number; close: number; volume: string };
}

export default function TopBar({ ohlcv }: TopBarProps) {
  return (
    <div className="flex flex-col bg-[#1e222d] text-[#d1d4dc] text-xs border-b border-[#2a2e39]">
      {/* Row 1: Ticker + toolbar */}
      <div className="flex items-center h-[38px] px-2 gap-1 border-b border-[#2a2e39]">
        <span className="font-semibold text-white text-sm mr-1">MESM2026</span>
        <button className="text-[#787b86] hover:text-white p-1"><Search size={14} /></button>
        <button className="text-[#787b86] hover:text-white p-1"><Plus size={14} /></button>
        <div className="flex items-center gap-0.5 ml-2">
          <button className="px-2 py-1 rounded hover:bg-[#2a2e39] text-[#d1d4dc]">1m</button>
          <button className="px-2 py-1 rounded hover:bg-[#2a2e39] text-[#787b86]">15m</button>
          <button className="text-[#787b86] hover:text-white p-1"><ChevronDown size={12} /></button>
        </div>
        <div className="w-px h-5 bg-[#2a2e39] mx-1" />
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#2a2e39]">
          <BarChart3 size={14} /> Indicators <ChevronDown size={10} />
        </button>
        <div className="w-px h-5 bg-[#2a2e39] mx-1" />
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#2a2e39]">
          <Bell size={14} /> Alert
        </button>
        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#2a2e39]">
          <Rewind size={14} /> Replay
        </button>
        <div className="w-px h-5 bg-[#2a2e39] mx-1" />
        <button className="text-[#787b86] hover:text-white p-1"><Undo size={14} /></button>
        <button className="text-[#787b86] hover:text-white p-1"><Redo size={14} /></button>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Bookmark size={14} /></button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Layout size={14} /></button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Square size={14} /></button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Ruler size={14} /></button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><PenTool size={14} /></button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Camera size={14} /></button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Eye size={14} /></button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Settings size={14} /></button>
          <div className="w-px h-5 bg-[#2a2e39] mx-1" />
          <span className="text-[#787b86] text-[11px]">Day Trading</span>
          <ChevronDown size={10} className="text-[#787b86]" />
          <div className="w-px h-5 bg-[#2a2e39] mx-1" />
          <button className="px-3 py-1 rounded hover:bg-[#2a2e39] text-[#d1d4dc]">Trade</button>
          <button className="px-3 py-1.5 rounded bg-[#2962ff] text-white font-medium hover:bg-[#1e53e5]">Publish</button>
        </div>
      </div>
      {/* Row 2: OHLCV + Bid/Ask */}
      <div className="flex items-center h-[28px] px-2 gap-2">
        <span className="text-[11px]">🇺🇸</span>
        <span className="text-[11px] text-[#787b86]">Micro E-mini S&P 500 Index Futures (Jun 2026) · 5 · CME</span>
        <span className="text-[11px] ml-2">
          O<span className="text-[#d1d4dc] ml-0.5">{ohlcv.open.toFixed(2)}</span>
          {' '}H<span className="text-[#d1d4dc] ml-0.5">{ohlcv.high.toFixed(2)}</span>
          {' '}L<span className="text-[#d1d4dc] ml-0.5">{ohlcv.low.toFixed(2)}</span>
          {' '}C<span className="text-[#d1d4dc] ml-0.5">{ohlcv.close.toFixed(2)}</span>
          {' '}<span className={ohlcv.close >= ohlcv.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
            {(ohlcv.close - ohlcv.open) >= 0 ? '+' : ''}{(ohlcv.close - ohlcv.open).toFixed(2)} ({((ohlcv.close - ohlcv.open) / ohlcv.open * 100).toFixed(2)}%)
          </span>
          {' '}Vol<span className="text-[#d1d4dc] ml-0.5">{ohlcv.volume}</span>
        </span>
        <div className="flex items-center gap-1 ml-3">
          <div className="flex items-center bg-[#ef5350] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
            <span>{(ohlcv.close - 0.50).toFixed(2)}</span>
            <span className="ml-1 text-[9px] opacity-80">SELL</span>
          </div>
          <div className="flex flex-col items-center text-[9px] text-[#787b86] leading-tight">
            <span>0.25</span>
            <span>3</span>
          </div>
          <div className="flex items-center bg-[#26a69a] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
            <span>{(ohlcv.close - 0.25).toFixed(2)}</span>
            <span className="ml-1 text-[9px] opacity-80">BUY</span>
          </div>
        </div>
        <div className="flex-1" />
        <span className="text-[11px] text-[#787b86]">USD</span>
      </div>
      {/* Row 3: Indicator label */}
      <div className="flex items-center h-[18px] px-2">
        <span className="text-[10px] text-[#787b86]">▼ 7</span>
      </div>
    </div>
  );
}
