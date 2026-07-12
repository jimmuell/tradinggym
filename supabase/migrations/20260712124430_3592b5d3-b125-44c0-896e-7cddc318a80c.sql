ALTER TABLE public.backtest_runs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.backtest_runs;