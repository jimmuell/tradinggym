DROP POLICY IF EXISTS guru_profiles_update_own ON public.guru_profiles;

CREATE POLICY guru_profiles_update_own
ON public.guru_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);