CREATE TABLE IF NOT EXISTS public.backtest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  strategy_name text NOT NULL,
  timeframe text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  initial_balance numeric(12,2) NOT NULL DEFAULT 10000,
  stop_loss_ticks integer NOT NULL DEFAULT 10,
  take_profit_ticks integer NOT NULL DEFAULT 20,
  max_trades_per_day integer NOT NULL DEFAULT 5,
  total_trades integer,
  wins integer,
  losses integer,
  net_pnl numeric(12,2),
  win_rate numeric(5,2),
  profit_factor numeric(8,2),
  max_drawdown numeric(12,2),
  avg_winner numeric(12,2),
  avg_loser numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backtest_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own backtest runs"
  ON public.backtest_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backtest runs"
  ON public.backtest_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backtest runs"
  ON public.backtest_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_user_created ON public.backtest_runs(user_id, created_at DESC);