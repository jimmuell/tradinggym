CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  strategy_name text NOT NULL,
  session_prep_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  execution_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_templates_select_own ON public.checklist_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY checklist_templates_insert_own ON public.checklist_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY checklist_templates_update_own ON public.checklist_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY checklist_templates_delete_own ON public.checklist_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.checklist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  strategy_name text NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  session_prep_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  execution_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  prep_complete boolean DEFAULT false,
  execution_complete boolean DEFAULT false,
  emotional_readiness boolean DEFAULT true,
  max_daily_loss numeric,
  trading_session text,
  htf_bias text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY checklist_sessions_select_own ON public.checklist_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY checklist_sessions_insert_own ON public.checklist_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY checklist_sessions_update_own ON public.checklist_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_checklist_sessions_user_date
  ON public.checklist_sessions(user_id, session_date DESC);

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS checklist_session_id uuid REFERENCES public.checklist_sessions(id) ON DELETE SET NULL;

CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_sessions_updated_at
  BEFORE UPDATE ON public.checklist_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.seed_default_checklists(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target_user_id IS NULL OR target_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.checklist_templates (user_id, strategy_name, is_default, session_prep_items, execution_items)
  VALUES (
    target_user_id,
    'ORB (Opening Range Breakout)',
    true,
    '[{"id":"sp-1","label":"Set max daily loss","type":"input","input_type":"currency","is_core":true},{"id":"sp-2","label":"Select trading session","type":"select","options":["NY Open","London","Asia","Other"],"is_core":true},{"id":"sp-3","label":"Confirm higher timeframe bias","type":"select","options":["Bullish","Bearish","Ranging"],"is_core":true},{"id":"sp-4","label":"Emotional readiness check","type":"toggle","is_core":true}]'::jsonb,
    '[{"id":"ex-1","label":"Mark Opening Range (high + low)","type":"toggle","is_core":true},{"id":"ex-2","label":"Wait for breakout candle close","type":"toggle","is_core":true},{"id":"ex-3","label":"Wait for retest","type":"toggle","is_core":true},{"id":"ex-4","label":"Confirm retest (close outside range)","type":"toggle","is_core":true},{"id":"ex-5","label":"Set SL at midpoint, TP at 2:1 R:R","type":"toggle","is_core":true},{"id":"ex-6","label":"Execute and record","type":"toggle","is_core":true}]'::jsonb
  );

  INSERT INTO public.checklist_templates (user_id, strategy_name, is_default, session_prep_items, execution_items)
  VALUES (
    target_user_id,
    'ORB + VWAP',
    true,
    '[{"id":"sp-1","label":"Set max daily loss","type":"input","input_type":"currency","is_core":true},{"id":"sp-2","label":"Select trading session","type":"select","options":["NY Open","London","Asia","Other"],"is_core":true},{"id":"sp-3","label":"Confirm higher timeframe bias","type":"select","options":["Bullish","Bearish","Ranging"],"is_core":true},{"id":"sp-4","label":"Emotional readiness check","type":"toggle","is_core":true}]'::jsonb,
    '[{"id":"ex-0","label":"Check VWAP direction — price above or below?","type":"select","options":["Above VWAP (longs only)","Below VWAP (shorts only)","At VWAP (no trade)"],"is_core":true},{"id":"ex-1","label":"Mark Opening Range (high + low)","type":"toggle","is_core":true},{"id":"ex-2","label":"Wait for breakout IN VWAP direction only","type":"toggle","is_core":true},{"id":"ex-3","label":"Wait for retest","type":"toggle","is_core":true},{"id":"ex-4","label":"Confirm retest (close outside range)","type":"toggle","is_core":true},{"id":"ex-5","label":"Set SL at midpoint, TP at 2:1 R:R","type":"toggle","is_core":true},{"id":"ex-6","label":"Execute and record","type":"toggle","is_core":true}]'::jsonb
  );

  INSERT INTO public.checklist_templates (user_id, strategy_name, is_default, session_prep_items, execution_items)
  VALUES (
    target_user_id,
    'AMD + IFVG',
    true,
    '[{"id":"sp-1","label":"Set max daily loss","type":"input","input_type":"currency","is_core":true},{"id":"sp-2","label":"Select trading session","type":"select","options":["NY Open","London","Asia","Other"],"is_core":true},{"id":"sp-3","label":"Confirm higher timeframe bias","type":"select","options":["Bullish","Bearish","Ranging"],"is_core":true},{"id":"sp-4","label":"Emotional readiness check","type":"toggle","is_core":true}]'::jsonb,
    '[{"id":"ex-1","label":"Session bias — price above or below VWAP?","type":"select","options":["Above VWAP","Below VWAP"],"is_core":true},{"id":"ex-2","label":"Identify accumulation zone (3+ overlapping candles)","type":"toggle","is_core":true},{"id":"ex-3","label":"Identify liquidity target (equal highs/lows)","type":"toggle","is_core":true},{"id":"ex-4","label":"Wait for manipulation sweep","type":"toggle","is_core":true},{"id":"ex-5","label":"Mark IFVG created by sweep candle","type":"toggle","is_core":true},{"id":"ex-6","label":"Enter at IFVG retest, SL beyond sweep, TP at 2:1","type":"toggle","is_core":true},{"id":"ex-7","label":"Record result and review delivery model","type":"toggle","is_core":true}]'::jsonb
  );
END;
$$;