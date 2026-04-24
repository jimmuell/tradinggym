import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYBACK_PHASES, PlaybackPhase, PlaybackScenario, phaseToBarIndex } from '@/lib/playbackTypes';

export type PlaybackSpeed = 0.5 | 1 | 2;

interface Options {
  scenario: PlaybackScenario | null | undefined;
  /** Called when current bar index should change (the chart consumes this) */
  onBarIndexChange: (idx: number) => void;
  /** Auto-advance bars within a phase */
  baseTickMs?: number;
}

interface State {
  phase: PlaybackPhase;
  barIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
}

export function usePlaybackMode({ scenario, onBarIndexChange, baseTickMs = 220 }: Options) {
  const [state, setState] = useState<State>({
    phase: 'context',
    barIndex: 0,
    isPlaying: false,
    speed: 1,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const timerRef = useRef<number | null>(null);

  // When scenario loads, jump to the context phase (showing first chunk).
  useEffect(() => {
    if (!scenario) return;
    const targetIdx = phaseToBarIndex('context', scenario);
    setState({ phase: 'context', barIndex: targetIdx, isPlaying: false, speed: 1 });
    onBarIndexChange(targetIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id]);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const goToPhase = useCallback(
    (phase: PlaybackPhase) => {
      if (!scenario) return;
      clearTimer();
      const targetIdx = phaseToBarIndex(phase, scenario);
      setState((s) => ({ ...s, phase, barIndex: targetIdx, isPlaying: false }));
      onBarIndexChange(targetIdx);
    },
    [scenario, onBarIndexChange],
  );

  const stepForward = useCallback(() => {
    if (!scenario) return;
    const cur = stateRef.current.phase;
    const idx = PLAYBACK_PHASES.indexOf(cur);
    const next = PLAYBACK_PHASES[Math.min(idx + 1, PLAYBACK_PHASES.length - 1)];
    goToPhase(next);
  }, [scenario, goToPhase]);

  const stepBack = useCallback(() => {
    if (!scenario) return;
    const cur = stateRef.current.phase;
    const idx = PLAYBACK_PHASES.indexOf(cur);
    const prev = PLAYBACK_PHASES[Math.max(idx - 1, 0)];
    goToPhase(prev);
  }, [scenario, goToPhase]);

  const reset = useCallback(() => {
    if (!scenario) return;
    goToPhase('context');
  }, [scenario, goToPhase]);

  const play = useCallback(() => {
    if (!scenario) return;
    clearTimer();
    setState((s) => ({ ...s, isPlaying: true }));

    timerRef.current = window.setInterval(() => {
      const s = stateRef.current;
      if (!scenario) return;
      const targetForCurrent = phaseToBarIndex(s.phase, scenario);
      // Advance one bar at a time toward the next phase target
      const curIdx = PLAYBACK_PHASES.indexOf(s.phase);
      const nextPhase = PLAYBACK_PHASES[Math.min(curIdx + 1, PLAYBACK_PHASES.length - 1)];
      const targetForNext = phaseToBarIndex(nextPhase, scenario);

      if (s.barIndex < targetForCurrent) {
        const newIdx = s.barIndex + 1;
        setState((p) => ({ ...p, barIndex: newIdx }));
        onBarIndexChange(newIdx);
        return;
      }

      // We've reached the current phase target — pause here for the user to read tooltip
      // unless next phase is "complete" — in that case auto-advance to end.
      if (s.barIndex >= targetForNext) {
        // already at/past next target; advance phase pointer
        if (nextPhase === s.phase) {
          // at terminal phase
          setState((p) => ({ ...p, isPlaying: false }));
          clearTimer();
          return;
        }
        setState((p) => ({ ...p, phase: nextPhase }));
        return;
      }

      // Step toward the next phase target, but stop and pause when we reach it.
      const newIdx = s.barIndex + 1;
      setState((p) => ({ ...p, barIndex: newIdx }));
      onBarIndexChange(newIdx);
      if (newIdx >= targetForNext) {
        // Advance the phase pointer and pause for tooltip read time
        setState((p) => ({ ...p, phase: nextPhase, isPlaying: false }));
        clearTimer();
      }
    }, baseTickMs / stateRef.current.speed);
  }, [scenario, onBarIndexChange, baseTickMs]);

  const pause = useCallback(() => {
    clearTimer();
    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  const setSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      setState((s) => ({ ...s, speed }));
      // If currently playing, restart the timer with the new speed
      if (stateRef.current.isPlaying) {
        clearTimer();
        // microtask so state.speed update lands first
        setTimeout(() => play(), 0);
      }
    },
    [play],
  );

  // Cleanup
  useEffect(() => () => clearTimer(), []);

  return {
    phase: state.phase,
    barIndex: state.barIndex,
    isPlaying: state.isPlaying,
    speed: state.speed,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    goToPhase,
    setSpeed,
  };
}
