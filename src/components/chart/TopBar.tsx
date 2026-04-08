import { useState } from 'react';
import {
  Search, Plus, ChevronDown, BarChart3, Bell, Rewind,
  Undo, Redo, Ruler, Square, PenTool, Eye, Settings,
  Layout, Camera, Bookmark
} from 'lucide-react';
import { Timeframe } from '@/lib/chartData';
import ChartSettingsModal from './ChartSettingsModal';

const timeframes: Timeframe[] = ['1m', '5m', '30m', '1h', '1D'];

interface TopBarProps {
  onTradeClick: () => void;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onReplayClick: () => void;
  replayMode: boolean;
}

export default function TopBar({ onTradeClick, timeframe, onTimeframeChange, onReplayClick, replayMode }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
    <ChartSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    <div className="flex items-center h-[38px] bg-[#1e222d] text-[#d1d4dc] text-xs px-2 gap-1 border-b border-[#2a2e39]">
      <span className="font-semibold text-white text-sm mr-1">ES</span>
      <button className="text-[#787b86] hover:text-white p-1"><Search size={14} /></button>
      <button className="text-[#787b86] hover:text-white p-1"><Plus size={14} /></button>
      <div className="flex items-center gap-0.5 ml-2">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2 py-1 rounded hover:bg-[#2a2e39] ${tf === timeframe ? 'text-[#d1d4dc] bg-[#2a2e39]' : 'text-[#787b86]'}`}
          >
            {tf}
          </button>
        ))}
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
      <button
        onClick={onReplayClick}
        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-[#2a2e39] ${replayMode ? 'text-[#2962ff]' : ''}`}
      >
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
        <button onClick={onTradeClick} className="px-3 py-1 rounded hover:bg-[#2a2e39] text-[#d1d4dc]">Trade</button>
        <button className="px-3 py-1.5 rounded bg-[#2962ff] text-white font-medium hover:bg-[#1e53e5]">Publish</button>
      </div>
    </div>
  );
}
