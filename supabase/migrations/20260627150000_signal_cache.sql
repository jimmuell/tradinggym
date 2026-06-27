-- BT-DET-1: content-addressed cache for AI-generated signal code.
-- Keyed by a hash of (scheme version + model + system-prompt fingerprint +
-- timeframe + canonicalized strategy config). The run-backtest edge function
-- reads this before calling Claude and reuses the cached code on a hit, giving
-- run-to-run signal determinism required by validation and compare/optimize.
-- A changed input produces a new hash (auto-invalidation); a force flag overwrites.
CREATE TABLE IF NOT EXISTS public.signal_cache (
  hash         text PRIMARY KEY,
  signal_code  text NOT NULL,                       -- RAW generated code (NO timezone-guard prefix)
  model        text NOT NULL,
  prompt_fp    text NOT NULL,
  timeframe    text,
  strategy_id  uuid REFERENCES public.strategies(id) ON DELETE SET NULL,  -- provenance only; null for ad-hoc runs
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  hit_count    integer NOT NULL DEFAULT 0
);

-- RLS enabled with NO policies = deny-all to anon/authenticated.
-- The run-backtest edge function uses the service-role key and bypasses RLS.
-- The cache must never be exposed to clients.
ALTER TABLE public.signal_cache ENABLE ROW LEVEL SECURITY;
