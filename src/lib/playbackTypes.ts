// Strategy Playback Trainer — shared types

export type PlaybackPhase = 'context' | 'setup' | 'confirmation' | 'entry' | 'exit' | 'complete';

export const PLAYBACK_PHASES: PlaybackPhase[] = ['context', 'setup', 'confirmation', 'entry', 'exit', 'complete'];

export const PHASE_LABELS: Record<PlaybackPhase, string> = {
  context: 'Context',
  setup: 'Setup',
  confirmation: 'Confirmation',
  entry: 'Entry',
  exit: 'Exit',
  complete: 'Complete',
};

export interface PlaybackCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type AnnotationColor = 'amber' | 'blue' | 'red' | 'green' | 'purple';

export interface AnnotationBase {
  phase: PlaybackPhase;
}

export interface BoxAnnotation extends AnnotationBase {
  type: 'box';
  fromBar: number;
  toBar: number;
  fromPrice: number;
  toPrice: number;
  color: AnnotationColor;
  label?: string;
}

export interface ArrowAnnotation extends AnnotationBase {
  type: 'arrow';
  bar: number;
  price: number;
  direction: 'up' | 'down';
  color: AnnotationColor;
  label?: string;
}

export interface PriceLineAnnotation extends AnnotationBase {
  type: 'priceLine';
  price: number;
  color: AnnotationColor;
  label: string;
}

export interface TooltipAnnotation extends AnnotationBase {
  type: 'tooltip';
  text: string;
  anchorBar: number;
}

export interface LabelAnnotation extends AnnotationBase {
  type: 'label';
  bar: number;
  price: number;
  text: string;
  color: AnnotationColor;
}

export type Annotation =
  | BoxAnnotation
  | ArrowAnnotation
  | PriceLineAnnotation
  | TooltipAnnotation
  | LabelAnnotation;

export interface PlaybackScenario {
  id: string;
  name: string;
  description: string | null;
  instrument: string;
  timeframe: string;
  direction: 'long' | 'short';
  indicator_tags: string[];
  ohlcv_data: PlaybackCandle[];
  setup_bar_index: number;
  confirmation_bar_index: number;
  entry_bar_index: number;
  entry_price: number;
  stop_price: number;
  target_price: number;
  exit_bar_index: number;
  exit_price: number;
  result_points: number;
  annotations: Annotation[];
}

/** Map a phase to the bar index in the scenario where that phase ends/pauses. */
export function phaseToBarIndex(phase: PlaybackPhase, scenario: PlaybackScenario): number {
  const total = scenario.ohlcv_data.length;
  switch (phase) {
    case 'context':
      // Show first ~30% of candles for context, but at least up to setup-2
      return Math.max(Math.min(scenario.setup_bar_index - 2, Math.floor(total * 0.3)), 5);
    case 'setup':
      return scenario.setup_bar_index;
    case 'confirmation':
      return scenario.confirmation_bar_index;
    case 'entry':
      return scenario.entry_bar_index;
    case 'exit':
      return scenario.exit_bar_index;
    case 'complete':
      return total;
  }
}
