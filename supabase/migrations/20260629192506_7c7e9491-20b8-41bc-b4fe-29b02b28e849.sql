
CREATE TABLE public.coach_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

GRANT SELECT ON public.coach_usage TO authenticated;
GRANT ALL ON public.coach_usage TO service_role;

ALTER TABLE public.coach_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own coach usage"
  ON public.coach_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_coach_usage_updated_at
  BEFORE UPDATE ON public.coach_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
