-- Investor documents table
CREATE TABLE IF NOT EXISTS public.investor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  file_url text,
  file_name text,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.investor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY investor_docs_select ON public.investor_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'investor'))
  );

CREATE POLICY investor_docs_admin_insert ON public.investor_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY investor_docs_admin_update ON public.investor_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY investor_docs_admin_delete ON public.investor_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Storage bucket for investor docs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('investor-docs', 'investor-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: admin+investor can read; admin only write
CREATE POLICY "investor_docs_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'investor-docs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','investor'))
  );

CREATE POLICY "investor_docs_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'investor-docs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "investor_docs_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'investor-docs'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Investor KPIs RPC
CREATE OR REPLACE FUNCTION public.get_investor_kpis()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin','investor')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'users_this_month', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '30 days'),
    'users_last_month', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '60 days' AND created_at <= now() - interval '30 days'),
    'mrr', (SELECT COALESCE(SUM(CASE WHEN plan_state='pro' THEN 29 WHEN plan_state='expert' THEN 49 WHEN plan_state='guru' THEN 99 ELSE 0 END), 0) FROM profiles),
    'arr', (SELECT COALESCE(SUM(CASE WHEN plan_state='pro' THEN 348 WHEN plan_state='expert' THEN 588 WHEN plan_state='guru' THEN 1188 ELSE 0 END), 0) FROM profiles),
    'paid_users', (SELECT COUNT(*) FROM profiles WHERE plan_state IN ('pro','expert','guru')),
    'free_users', (SELECT COUNT(*) FROM profiles WHERE plan_state IN ('starter','foundation')),
    'conversion_rate', (SELECT CASE WHEN COUNT(*)=0 THEN 0 ELSE ROUND((COUNT(*) FILTER (WHERE plan_state IN ('pro','expert','guru'))::numeric / COUNT(*)::numeric)*100, 1) END FROM profiles),
    'plan_starter', (SELECT COUNT(*) FROM profiles WHERE plan_state='starter'),
    'plan_pro', (SELECT COUNT(*) FROM profiles WHERE plan_state='pro'),
    'plan_expert', (SELECT COUNT(*) FROM profiles WHERE plan_state='expert'),
    'plan_guru', (SELECT COUNT(*) FROM profiles WHERE plan_state='guru'),
    'total_strategies', (SELECT COUNT(*) FROM strategies WHERE COALESCE(is_system,false)=false),
    'total_trades', (SELECT COUNT(*) FROM trades),
    'active_gurus', (SELECT COUNT(*) FROM guru_profiles WHERE status='active'),
    'total_classes', (SELECT COUNT(*) FROM classes),
    'total_enrollments', (SELECT COUNT(*) FROM class_enrollments WHERE status='active'),
    'total_lessons', (SELECT COUNT(*) FROM lessons WHERE is_published=true),
    'total_quiz_attempts', (SELECT COUNT(*) FROM quiz_attempts),
    'playback_scenarios', (SELECT COUNT(*) FROM strategy_playback_scenarios WHERE is_active=true),
    'weekly_growth', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT date_trunc('week', created_at)::date AS week, COUNT(*) AS signups
        FROM profiles
        WHERE created_at > now() - interval '12 weeks'
        GROUP BY 1 ORDER BY 1
      ) t
    ),
    'mrr_trend', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT date_trunc('week', created_at)::date AS week,
          SUM(CASE WHEN plan_state='pro' THEN 29 WHEN plan_state='expert' THEN 49 WHEN plan_state='guru' THEN 99 ELSE 0 END) AS mrr_at_signup
        FROM profiles
        WHERE created_at > now() - interval '12 weeks' AND plan_state IN ('pro','expert','guru')
        GROUP BY 1 ORDER BY 1
      ) t
    )
  );
END;
$$;