import {
  Search, Plus, ChevronDown, BarChart3, Bell, Rewind,
  Undo, Redo, Ruler, Square, PenTool, Eye, Settings,
  Layout, Camera, Bookmark
} from 'lucide-react';

interface TopBarProps {
  onTradeClick: () => void;
}

export default function TopBar({ onTradeClick }: TopBarProps) {
  return (
    <div className="flex items-center h-[38px] bg-[#1e222d] text-[#d1d4dc] text-xs px-2 gap-1 border-b border-[#2a2e39]">
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
        <button
          onClick={onTradeClick}
          className="px-3 py-1 rounded hover:bg-[#2a2e39] text-[#d1d4dc]"
        >
          Trade
        </button>
        <button className="px-3 py-1.5 rounded bg-[#2962ff] text-white font-medium hover:bg-[#1e53e5]">Publish</button>
      </div>
    </div>
  );
}
