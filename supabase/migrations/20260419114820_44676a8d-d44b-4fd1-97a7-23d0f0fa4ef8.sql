ALTER TABLE cohort_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_type text DEFAULT 'organic',
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS commission_rate integer,
  ADD COLUMN IF NOT EXISTS discount_applied boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_starts_at timestamptz;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referred_by_guru_id uuid REFERENCES guru_profiles(id);

CREATE INDEX IF NOT EXISTS idx_cohort_enrollments_stripe_subscription_id
  ON cohort_enrollments(stripe_subscription_id);