import { Play, Pause, SkipBack, SkipForward, X, RotateCcw } from 'lucide-react';

interface ReplayControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onExit: () => void;
  currentBar: number;
  totalBars: number;
}

export default function ReplayControls({
  isPlaying, onPlay, onPause, onStepBack, onStepForward, onReset, onExit,
  currentBar, totalBars,
}: ReplayControlsProps) {
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-accent rounded-lg px-2 py-1 shadow-lg border border-muted">
      <button onClick={onReset} disabled={currentBar === 0} className={`w-8 h-8 flex items-center justify-center rounded hover:bg-muted ${currentBar === 0 ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-foreground'}`} title="Reset to start">
        <RotateCcw size={14} />
      </button>
      <button onClick={onStepBack} disabled={currentBar === 0} className={`w-8 h-8 flex items-center justify-center rounded hover:bg-muted ${currentBar === 0 ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-foreground'}`}>
        <SkipBack size={14} />
      </button>
      {isPlaying ? (
        <button onClick={onPause} className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-foreground">
          <Pause size={14} />
        </button>
      ) : (
        <button onClick={onPlay} className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-[#2962ff]">
          <Play size={14} />
        </button>
      )}
      <button onClick={onStepForward} className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-foreground">
        <SkipForward size={14} />
      </button>
      <span className="text-[11px] text-muted-foreground mx-2">{currentBar}/{totalBars}</span>
      <button onClick={onExit} className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-[#ef5350]">
        <X size={14} />
      </button>
    </div>
  );
}
