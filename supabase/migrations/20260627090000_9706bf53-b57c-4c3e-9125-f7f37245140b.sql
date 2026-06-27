-- Step 3: expose engine execution parameters (percent-native) on backtest_runs.
-- Defaults 0/0/1 reproduce today's hardcoded engine request exactly.
ALTER TABLE public.backtest_runs
  ADD COLUMN IF NOT EXISTS stop_loss_pct   numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS take_profit_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_value       numeric NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backtest_runs_stop_loss_pct_chk') THEN
    ALTER TABLE public.backtest_runs ADD CONSTRAINT backtest_runs_stop_loss_pct_chk
      CHECK (stop_loss_pct >= 0 AND stop_loss_pct <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backtest_runs_take_profit_pct_chk') THEN
    ALTER TABLE public.backtest_runs ADD CONSTRAINT backtest_runs_take_profit_pct_chk
      CHECK (take_profit_pct >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backtest_runs_qty_value_chk') THEN
    ALTER TABLE public.backtest_runs ADD CONSTRAINT backtest_runs_qty_value_chk
      CHECK (qty_value >= 1);
  END IF;
END $$;
