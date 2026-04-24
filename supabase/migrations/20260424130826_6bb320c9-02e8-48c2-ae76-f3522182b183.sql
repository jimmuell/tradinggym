CREATE TABLE IF NOT EXISTS public.strategy_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_text text NOT NULL,
  extracted_json jsonb,
  saved_strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY extractions_select_own ON public.strategy_extractions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY extractions_insert_own ON public.strategy_extractions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY extractions_update_own ON public.strategy_extractions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY extractions_delete_own ON public.strategy_extractions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_strategy_extractions_user_created
  ON public.strategy_extractions (user_id, created_at DESC);