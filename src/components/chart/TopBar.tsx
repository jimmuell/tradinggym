import { useState } from 'react';
import {
  Search, Plus, ChevronDown, BarChart3, Bell, Rewind,
  Undo, Redo, Ruler, Square, PenTool, Eye, Settings,
  Layout, Camera, Bookmark
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Timeframe } from '@/lib/chartData';
import { InstrumentKey, INSTRUMENTS } from '@/lib/instruments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ChartSettingsModal from './ChartSettingsModal';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

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
  instrument: InstrumentKey;
  onInstrumentChange: (inst: InstrumentKey) => void;
}

export default function TopBar({ onTradeClick, timeframe, onTimeframeChange, onReplayClick, replayMode, instrument, onInstrumentChange }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <TooltipProvider>
    <>
    <ChartSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    <div className="flex items-center h-[38px] bg-card text-foreground text-xs px-2 gap-1 border-b border-border">
      <Select value={instrument} onValueChange={(v) => onInstrumentChange(v as InstrumentKey)}>
        <SelectTrigger className="h-7 w-[72px] text-sm font-semibold border-border px-2 py-0 gap-1 [&>svg]:h-3 [&>svg]:w-3">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(INSTRUMENTS) as InstrumentKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              <span className="font-semibold">{key}</span>
              <span className="text-muted-foreground ml-1.5 text-xs">{INSTRUMENTS[key].name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button className="text-muted-foreground hover:text-foreground p-1"><Search size={14} /></button>
      <button className="text-muted-foreground hover:text-foreground p-1"><Plus size={14} /></button>
      <div className="flex items-center gap-0.5 ml-2">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2 py-1 rounded hover:bg-accent ${tf === timeframe ? 'text-foreground bg-accent' : 'text-muted-foreground'}`}
          >
            {tf}
          </button>
        ))}
        <button className="text-muted-foreground hover:text-foreground p-1"><ChevronDown size={12} /></button>
      </div>
      <div className="w-px h-5 bg-border mx-1" />
      <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
        <CandlestickIcon />
      </button>
      <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent">
        <BarChart3 size={14} /> Indicators <ChevronDown size={10} />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent">
        <Bell size={14} /> Alert
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onReplayClick}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-accent ${replayMode ? 'text-[#2962ff]' : ''}`}
          >
            <Rewind size={14} /> Replay
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Replay historical market data bar by bar</p>
        </TooltipContent>
      </Tooltip>
      <div className="w-px h-5 bg-border mx-1" />
      <button className="text-muted-foreground hover:text-foreground p-1"><Undo size={14} /></button>
      <button className="text-muted-foreground hover:text-foreground p-1"><Redo size={14} /></button>
      <div className="flex-1" />
      <div className="flex items-center gap-0.5">
        <KeyboardShortcutsModal />
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Bookmark size={14} /></button>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Layout size={14} /></button>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Square size={14} /></button>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Ruler size={14} /></button>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><PenTool size={14} /></button>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Camera size={14} /></button>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Eye size={14} /></button>
        <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded hover:bg-accent text-muted-foreground"><Settings size={14} /></button>
        <div className="w-px h-5 bg-border mx-1" />
        <span className="text-muted-foreground text-[11px]">Day Trading</span>
        <ChevronDown size={10} className="text-muted-foreground" />
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={onTradeClick} className="px-3 py-1 rounded hover:bg-accent text-foreground">Trade</button>
        <button className="px-3 py-1.5 rounded bg-[#2962ff] text-white font-medium hover:bg-[#1e53e5]">Publish</button>
      </div>
    </div>
    </>
    </TooltipProvider>
  );
}
