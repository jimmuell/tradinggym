-- Step 2a: persist the validation budget used for each backtest run.
-- run_validation NOT NULL DEFAULT true / validation_iterations DEFAULT 2000 —
--   existing rows backfill to today's behavior; a run that doesn't specify a
--   budget is recorded as having used the default, which is what actually ran.
-- CHECK (… BETWEEN 100 AND 20000) — mirrors the engine's accepted range so a
--   bad value is rejected at the DB boundary, not only by the engine.
ALTER TABLE backtest_runs
  ADD COLUMN run_validation boolean NOT NULL DEFAULT true,
  ADD COLUMN validation_iterations integer NOT NULL DEFAULT 2000
    CHECK (validation_iterations BETWEEN 100 AND 20000);
