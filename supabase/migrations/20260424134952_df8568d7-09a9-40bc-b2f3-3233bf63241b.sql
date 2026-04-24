ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE public.strategies
  DROP CONSTRAINT IF EXISTS strategies_source_check;

ALTER TABLE public.strategies
  ADD CONSTRAINT strategies_source_check CHECK (source IN ('manual', 'ai_extracted'));