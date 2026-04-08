import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';

interface ReplayControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onExit: () => void;
  currentBar: number;
  totalBars: number;
}

export default function ReplayControls({
  isPlaying, onPlay, onPause, onStepBack, onStepForward, onExit,
  currentBar, totalBars,
}: ReplayControlsProps) {
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#2a2e39] rounded-lg px-2 py-1 shadow-lg border border-[#363a45]">
      <button onClick={onStepBack} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#363a45] text-[#d1d4dc]">
        <SkipBack size={14} />
      </button>
      {isPlaying ? (
        <button onClick={onPause} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#363a45] text-[#d1d4dc]">
          <Pause size={14} />
        </button>
      ) : (
        <button onClick={onPlay} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#363a45] text-[#2962ff]">
          <Play size={14} />
        </button>
      )}
      <button onClick={onStepForward} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#363a45] text-[#d1d4dc]">
        <SkipForward size={14} />
      </button>
      <span className="text-[11px] text-[#787b86] mx-2">{currentBar}/{totalBars}</span>
      <button onClick={onExit} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#363a45] text-[#ef5350]">
        <X size={14} />
      </button>
    </div>
  );
}
