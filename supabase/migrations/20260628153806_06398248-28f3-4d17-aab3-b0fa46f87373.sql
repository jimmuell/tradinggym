ALTER TABLE public.backtest_runs
  ADD COLUMN IF NOT EXISTS stop_loss_points   numeric  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS take_profit_points numeric  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slippage_ticks     integer  NOT NULL DEFAULT 0;

ALTER TABLE public.backtest_runs
  ADD CONSTRAINT backtest_runs_stop_loss_points_nonneg   CHECK (stop_loss_points   >= 0),
  ADD CONSTRAINT backtest_runs_take_profit_points_nonneg CHECK (take_profit_points >= 0),
  ADD CONSTRAINT backtest_runs_slippage_ticks_nonneg     CHECK (slippage_ticks     >= 0);