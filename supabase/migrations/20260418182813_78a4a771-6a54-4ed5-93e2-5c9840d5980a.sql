ALTER TABLE public.guru_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_status text DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.guru_referrals (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id                uuid REFERENCES public.guru_profiles(id) ON DELETE CASCADE,
  referred_user_id       uuid REFERENCES public.profiles(id),
  referral_code          text NOT NULL,
  redeemed_at            timestamptz,
  stripe_subscription_id text,
  commission_rate        integer DEFAULT 50,
  status                 text DEFAULT 'pending',
  created_at             timestamptz DEFAULT now()
);

ALTER TABLE public.guru_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guru can read own referrals"
  ON public.guru_referrals
  FOR SELECT
  USING (
    guru_id IN (
      SELECT id FROM public.guru_profiles WHERE user_id = auth.uid()
    )
  );