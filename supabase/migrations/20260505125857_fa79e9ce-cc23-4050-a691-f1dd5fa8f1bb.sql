ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS strategy_config JSONB DEFAULT '{}';
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS results_detail JSONB DEFAULT '{}';
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS equity_curve JSONB DEFAULT '[]';
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS ai_signal_code TEXT;
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS engine_version TEXT;
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER;
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'long_short';
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS commission_pct NUMERIC DEFAULT 0.1;