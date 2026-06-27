-- BT-CMP-0: persist the BT-DET-1 signal hash on each run so compare/optimize can group
-- runs that share an identical generated signal. Nullable — existing rows backfill to NULL
-- (the compare UI falls back to ai_signal_code for pre-enabler runs). Same value as the
-- signal_cache primary key.
ALTER TABLE public.backtest_runs ADD COLUMN IF NOT EXISTS signal_hash text;
