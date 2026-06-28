-- Point-denominated stops (ADR-023) + slippage (ADR-024) on backtest_runs.
-- Execution params, percent-native siblings already exist (Step 3). Engine stores points.

ALTER TABLE public.backtest_runs
  ADD COLUMN IF NOT EXISTS stop_loss_points   numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS take_profit_points numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slippage_ticks     integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backtest_runs_stop_loss_points_chk') THEN
    ALTER TABLE public.backtest_runs ADD CONSTRAINT backtest_runs_stop_loss_points_chk
      CHECK (stop_loss_points >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backtest_runs_take_profit_points_chk') THEN
    ALTER TABLE public.backtest_runs ADD CONSTRAINT backtest_runs_take_profit_points_chk
      CHECK (take_profit_points >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backtest_runs_slippage_ticks_chk') THEN
    ALTER TABLE public.backtest_runs ADD CONSTRAINT backtest_runs_slippage_ticks_chk
      CHECK (slippage_ticks >= 0);
  END IF;
END $$;
