import { useState } from 'react';
import {
  Search, Plus, ChevronDown, BarChart3, Bell, Rewind,
  Undo, Redo, Ruler, Square, PenTool, Eye, Settings,
  Layout, Camera, Bookmark
} from 'lucide-react';
import { Timeframe } from '@/lib/chartData';
import ChartSettingsModal from './ChartSettingsModal';

const timeframes: Timeframe[] = ['1m', '5m', '30m', '1h', '1D'];

const CandlestickIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="4" width="3" height="8" fill="#26a69a" stroke="#26a69a" strokeWidth="0.5"/>
    <line x1="4.5" y1="1" x2="4.5" y2="4" stroke="#26a69a" strokeWidth="1"/>
    <line x1="4.5" y1="12" x2="4.5" y2="15" stroke="#26a69a" strokeWidth="1"/>
    <rect x="10" y="5" width="3" height="6" fill="#ef5350" stroke="#ef5350" strokeWidth="0.5"/>
    <line x1="11.5" y1="2" x2="11.5" y2="5" stroke="#ef5350" strokeWidth="1"/>
    <line x1="11.5" y1="11" x2="11.5" y2="14" stroke="#ef5350" strokeWidth="1"/>
  </svg>
);

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
      <span className="font-semibold text-white text-sm mr-1 px-2 py-0.5 border border-[#2a2e39] rounded">ES</span>
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
      <button className="p-1 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]">
        <CandlestickIcon />
      </button>
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
        <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86]"><Settings size={14} /></button>
        <div className="w-px h-5 bg-[#2a2e39] mx-1" />
        <span className="text-[#787b86] text-[11px]">Day Trading</span>
        <ChevronDown size={10} className="text-[#787b86]" />
        <div className="w-px h-5 bg-[#2a2e39] mx-1" />
        <button onClick={onTradeClick} className="px-3 py-1 rounded hover:bg-[#2a2e39] text-[#d1d4dc]">Trade</button>
        <button className="px-3 py-1.5 rounded bg-[#2962ff] text-white font-medium hover:bg-[#1e53e5]">Publish</button>
      </div>
    </div>
    </>
  );
}
