-- Strategy Playback Scenarios table
CREATE TABLE IF NOT EXISTS public.strategy_playback_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  instrument text NOT NULL DEFAULT 'MES',
  timeframe text NOT NULL DEFAULT '5m',
  direction text NOT NULL DEFAULT 'long',
  indicator_tags text[] NOT NULL DEFAULT '{}',
  ohlcv_data jsonb NOT NULL,
  setup_bar_index integer NOT NULL,
  confirmation_bar_index integer NOT NULL,
  entry_bar_index integer NOT NULL,
  entry_price numeric NOT NULL,
  stop_price numeric NOT NULL,
  target_price numeric NOT NULL,
  exit_bar_index integer NOT NULL,
  exit_price numeric NOT NULL,
  result_points numeric NOT NULL,
  annotations jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_playback_scenarios ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read active scenarios
CREATE POLICY "playback_scenarios_select_active"
ON public.strategy_playback_scenarios
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_playback_scenarios_active
  ON public.strategy_playback_scenarios (is_active);
CREATE INDEX IF NOT EXISTS idx_playback_scenarios_indicator_tags
  ON public.strategy_playback_scenarios USING GIN (indicator_tags);
