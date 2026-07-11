CREATE TABLE public.plan_reconciliation_log (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz not null default now(),
  user_id uuid not null,
  stripe_customer_id text,
  app_plan_state text not null,
  stripe_plan_state text not null,
  stripe_status text,
  drift boolean not null,
  note text
);

GRANT SELECT ON public.plan_reconciliation_log TO authenticated;
GRANT ALL ON public.plan_reconciliation_log TO service_role;

ALTER TABLE public.plan_reconciliation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliation log"
  ON public.plan_reconciliation_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE INDEX plan_reconciliation_log_checked_at_idx
  ON public.plan_reconciliation_log (checked_at DESC);

CREATE INDEX plan_reconciliation_log_drift_idx
  ON public.plan_reconciliation_log (drift);
