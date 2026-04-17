-- guru_profiles table
CREATE TABLE public.guru_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  slug TEXT UNIQUE,
  stripe_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended')),
  trial_ends_at TIMESTAMPTZ,
  trial_dismissed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.guru_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guru_profiles_select_own"
  ON public.guru_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "guru_profiles_update_own"
  ON public.guru_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_guru_profiles_updated_at
  BEFORE UPDATE ON public.guru_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- guru_applications table
CREATE TABLE public.guru_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  trading_style TEXT NOT NULL,
  years_experience TEXT NOT NULL
    CHECK (years_experience IN ('under_1', '1_3', '3_5', '5_10', 'over_10')),
  what_you_teach TEXT NOT NULL,
  existing_presence TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

ALTER TABLE public.guru_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guru_applications_select_own"
  ON public.guru_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "guru_applications_insert_own"
  ON public.guru_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);