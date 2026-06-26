-- T-101: Store the backtest engine's honest validation verdict.
-- The engine's /run response already returns a `validation` object (overall
-- status + summary + findings + regimes + skipped) and a `validation_error`
-- string; persist both so the results UI can surface the verdict verbatim.
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS validation JSONB;
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS validation_error TEXT;
