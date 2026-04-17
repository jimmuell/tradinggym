CREATE TABLE public.guru_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id UUID NOT NULL REFERENCES public.guru_profiles(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'post'
    CHECK (content_type IN ('lesson', 'post', 'blueprint')),
  is_draft BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guru_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guru_content_select_guru"
  ON public.guru_content FOR SELECT
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "guru_content_insert_guru"
  ON public.guru_content FOR INSERT
  WITH CHECK (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "guru_content_update_guru"
  ON public.guru_content FOR UPDATE
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "guru_content_delete_guru"
  ON public.guru_content FOR DELETE
  USING (
    guru_id IN (SELECT id FROM public.guru_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "guru_content_select_student"
  ON public.guru_content FOR SELECT
  USING (
    is_draft = false
    AND cohort_id IN (
      SELECT cohort_id FROM public.cohort_enrollments
      WHERE student_id = auth.uid() AND status = 'active'
    )
  );

CREATE TRIGGER update_guru_content_updated_at
  BEFORE UPDATE ON public.guru_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_guru_content_guru_id ON public.guru_content(guru_id);
CREATE INDEX idx_guru_content_cohort_id ON public.guru_content(cohort_id);
CREATE INDEX idx_guru_content_published ON public.guru_content(cohort_id, is_draft, published_at DESC);