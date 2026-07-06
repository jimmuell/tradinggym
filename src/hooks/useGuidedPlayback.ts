import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GUIDED_BEATS,
  GuidedBeat,
  PlaybackScenario,
  guidedBeatToBarIndex,
} from '@/lib/playbackTypes';

export type GuidedOutcome = 'pending' | 'win' | 'loss';

interface Options {
  scenario: PlaybackScenario | null | undefined;
  onBarIndexChange: (idx: number) => void;
}

interface State {
  beat: GuidedBeat;
  /** Extra candles revealed during beat 6 (0..N). */
  extra: number;
  outcome: GuidedOutcome;
  /** Bar index where outcome resolved (if any). */
  outcomeBarIdx: number | null;
}

export function useGuidedPlayback({ scenario, onBarIndexChange }: Options) {
  const [state, setState] = useState<State>({
    beat: 1,
    extra: 0,
    outcome: 'pending',
    outcomeBarIdx: null,
  });
  // Track whether the user has clicked "Start" (leaves the initial single-candle view).
  const [started, setStarted] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Reset when scenario changes; initial view shows ONLY the first candle.
  useEffect(() => {
    if (!scenario) return;
    setState({ beat: 1, extra: 0, outcome: 'pending', outcomeBarIdx: null });
    setStarted(false);
    onBarIndexChange(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id]);

  const barIdxForBeat = useCallback(
    (beat: GuidedBeat, extra: number) => {
      if (!scenario) return 0;
      const base = guidedBeatToBarIndex(beat, scenario);
      if (beat === 6) {
        const maxIdx = scenario.ohlcv_data.length - 1;
        return Math.min(base + extra, maxIdx);
      }
      return base;
    },
    [scenario],
  );

  const applyBeat = useCallback(
    (beat: GuidedBeat) => {
      if (!scenario) return;
      setStarted(true);
      const idx = barIdxForBeat(beat, 0);
      setState({ beat, extra: 0, outcome: 'pending', outcomeBarIdx: null });
      onBarIndexChange(idx);
    },
    [scenario, barIdxForBeat, onBarIndexChange],
  );

  const goToBeat = useCallback(
    (beat: GuidedBeat) => {
      applyBeat(beat);
    },
    [applyBeat],
  );

  const nextBeat = useCallback(() => {
    const cur = stateRef.current.beat;
    const idx = GUIDED_BEATS.indexOf(cur);
    const next = GUIDED_BEATS[Math.min(idx + 1, GUIDED_BEATS.length - 1)];
    applyBeat(next);
  }, [applyBeat]);

  const prevBeat = useCallback(() => {
    const cur = stateRef.current.beat;
    const idx = GUIDED_BEATS.indexOf(cur);
    const prev = GUIDED_BEATS[Math.max(idx - 1, 0)];
    applyBeat(prev);
  }, [applyBeat]);

  const reset = useCallback(() => {
    if (!scenario) return;
    setState({ beat: 1, extra: 0, outcome: 'pending', outcomeBarIdx: null });
    setStarted(false);
    onBarIndexChange(0);
  }, [scenario, onBarIndexChange]);

  const start = useCallback(() => {
    applyBeat(1);
  }, [applyBeat]);

  /** Beat 6 only: reveal one more candle; auto-resolve win/loss. */
  const nextCandle = useCallback(() => {
    if (!scenario) return;
    const s = stateRef.current;
    if (s.beat !== 6 || s.outcome !== 'pending') return;
    const maxIdx = scenario.ohlcv_data.length - 1;
    const entryIdx = scenario.entry_bar_index;
    const nextExtra = Math.min(s.extra + 1, maxIdx - entryIdx);
    const idx = entryIdx + nextExtra;
    const candle = scenario.ohlcv_data[idx];
    let outcome: GuidedOutcome = 'pending';
    if (candle) {
      if (candle.high >= scenario.target_price) outcome = 'win';
      else if (candle.low <= scenario.stop_price) outcome = 'loss';
    }
    // If we hit end of data without resolution, mark as loss/win by proximity — leave pending.
    setState({
      beat: 6,
      extra: nextExtra,
      outcome,
      outcomeBarIdx: outcome !== 'pending' ? idx : null,
    });
    onBarIndexChange(idx);
  }, [scenario, onBarIndexChange]);

  const barIndex = barIdxForBeat(state.beat, state.extra);

  return {
    beat: state.beat,
    extra: state.extra,
    outcome: state.outcome,
    outcomeBarIdx: state.outcomeBarIdx,
    started,
    barIndex,
    goToBeat,
    nextBeat,
    prevBeat,
    nextCandle,
    reset,
    start,
  };
}
