CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id UUID NOT NULL REFERENCES public.guru_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  win_rate_gate INTEGER NOT NULL DEFAULT 70
    CHECK (win_rate_gate BETWEEN 0 AND 100),
  max_students INTEGER,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed')),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cohorts_select_own"
  ON public.cohorts FOR SELECT
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "cohorts_insert_own"
  ON public.cohorts FOR INSERT
  WITH CHECK (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "cohorts_update_own"
  ON public.cohorts FOR UPDATE
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "cohorts_delete_draft_own"
  ON public.cohorts FOR DELETE
  USING (
    status = 'draft'
    AND guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_cohorts_updated_at
  BEFORE UPDATE ON public.cohorts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cohorts_guru_id ON public.cohorts(guru_id);