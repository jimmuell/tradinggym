import { Play, Pause, SkipBack, SkipForward, RotateCcw, X, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PlaybackScenario, PlaybackPhase, TooltipAnnotation } from '@/lib/playbackTypes';
import { PHASE_LABELS, PLAYBACK_PHASES } from '@/lib/playbackTypes';
import type { PlaybackSpeed } from '@/hooks/usePlaybackMode';
import { useTier } from '@/contexts/TierContext';

interface Props {
  scenario: PlaybackScenario;
  phase: PlaybackPhase;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onExit: () => void;
  onSpeedChange: (s: PlaybackSpeed) => void;
  onGoToPhase: (p: PlaybackPhase) => void;
  /** Triggered when user clicks "Try It Yourself" CTA at end. */
  onTryItYourself: () => void;
  /** When true, bypass the Starter-tier paywall for this scenario. */
  allowFullPlayback?: boolean;
}

const PHASE_ORDER: PlaybackPhase[] = ['context', 'setup', 'confirmation', 'entry', 'exit', 'complete'];

export default function PlaybackOverlay({
  scenario,
  phase,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onReset,
  onExit,
  onSpeedChange,
  onGoToPhase,
  onTryItYourself,
  allowFullPlayback = false,
}: Props) {
  const navigate = useNavigate();
  const { planState, isAdmin } = useTier();
  const isLockedPlan = !allowFullPlayback && !isAdmin && planState === 'starter';
  const lockedAfter: PlaybackPhase = 'context'; // Starter sees only Context

  const tooltips = (scenario.annotations ?? []).filter(
    (a): a is TooltipAnnotation => a.type === 'tooltip',
  );
  const currentTooltip = tooltips.find((t) => t.phase === phase);

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const lockedPhaseIndex = PHASE_ORDER.indexOf(lockedAfter);
  const isPhaseLocked = (p: PlaybackPhase) =>
    isLockedPlan && PHASE_ORDER.indexOf(p) > lockedPhaseIndex;

  return (
    <>
      {/* Top header bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-card/95 backdrop-blur border border-border rounded-lg px-3 py-1.5 shadow-lg max-w-[90%]">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[12px] font-semibold text-foreground truncate">{scenario.name}</span>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          · {scenario.instrument} · {scenario.timeframe} · {scenario.direction}
        </span>
        <button
          onClick={onExit}
          className="ml-1 p-1 rounded hover:bg-muted text-muted-foreground"
          aria-label="Exit playback"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Phase stepper */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-card/95 backdrop-blur border border-border rounded-lg px-2 py-1 shadow-lg">
        {PLAYBACK_PHASES.filter((p) => p !== 'complete').map((p, i) => {
          const isActive = p === phase;
          const isPast = PHASE_ORDER.indexOf(p) < phaseIndex;
          const locked = isPhaseLocked(p);
          const isNext = PHASE_ORDER.indexOf(p) === phaseIndex + 1 && !locked;
          return (
            <div key={p} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button
                onClick={() => !locked && onGoToPhase(p)}
                disabled={locked}
                className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isPast
                    ? 'text-foreground hover:bg-muted'
                    : locked
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-muted'
                } ${isNext ? 'ring-2 ring-primary animate-pulse' : ''}`}
                title={locked ? 'Upgrade to Pro to unlock' : PHASE_LABELS[p]}
              >
                {i + 1}. {PHASE_LABELS[p]}
                {locked && ' 🔒'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Helper cue under phase stepper */}
      {phase !== 'context' && phase !== 'complete' && (
        <div className="absolute top-[5.25rem] left-1/2 -translate-x-1/2 z-30 text-[11px] text-primary font-medium bg-card/95 backdrop-blur border border-primary/30 rounded px-2 py-0.5 shadow animate-pulse">
          Click the next step above to continue
        </div>
      )}

      {/* Start walkthrough CTA — only at initial context phase before playing */}
      {phase === 'context' && !isPlaying && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fade-in">
          <button
            onClick={onStepForward}
            className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-2xl hover:bg-primary/90 transition-colors"
          >
            <Play className="h-4 w-4" />
            Start walkthrough
          </button>
        </div>
      )}

      {/* Tooltip card */}
      {currentTooltip && !isPhaseLocked(currentTooltip.phase) && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-card border border-primary/40 rounded-lg shadow-xl px-4 py-3 max-w-md animate-fade-in">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-0.5">
                {PHASE_LABELS[currentTooltip.phase]}
              </div>
              <div className="text-[13px] text-foreground leading-relaxed">{currentTooltip.text}</div>
            </div>
          </div>
        </div>
      )}

      {/* Starter-tier blur + upgrade CTA */}
      {isLockedPlan && phaseIndex > lockedPhaseIndex && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm text-center shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Unlock Full Playback</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Watch the full Setup → Entry → Exit walkthrough on Pro. Free shows the Context phase only.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => onGoToPhase(lockedAfter)}
              className="block w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Back to Context
            </button>
          </div>
        </div>
      )}

      {/* Completion CTA */}
      {phase === 'complete' && !isLockedPlan && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-primary/40 rounded-xl p-6 max-w-sm text-center shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-[#26a69a]/15 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-[#26a69a]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Demo Complete</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Result: <span className="text-[#26a69a] font-semibold">+{scenario.result_points} pts</span>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              You've seen the setup play out. Now try executing it yourself on the same data.
            </p>
            <button
              onClick={onTryItYourself}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Try It Yourself →
            </button>
            <button
              onClick={onReset}
              className="block w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Replay
            </button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-card/95 backdrop-blur border border-border rounded-lg px-2 py-1.5 shadow-lg">
        <button
          onClick={onReset}
          className="p-1.5 rounded hover:bg-muted text-foreground"
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={onStepBack}
          className="p-1.5 rounded hover:bg-muted text-foreground"
          title="Step back"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        {isPlaying ? (
          <button onClick={onPause} className="p-1.5 rounded hover:bg-muted text-foreground" title="Pause">
            <Pause className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={onPlay} className="p-1.5 rounded hover:bg-muted text-primary" title="Play">
            <Play className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onStepForward}
          className="p-1.5 rounded hover:bg-muted text-foreground"
          title="Step forward"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        {([0.5, 1, 2] as PlaybackSpeed[]).map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`text-[11px] font-medium px-1.5 py-1 rounded ${
              speed === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </>
  );
}
