
-- Fix INSERT policy to enforce tier_state = 'foundation' on new profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id
    AND tier_state = 'foundation'
  );

-- Add UPDATE policy that prevents tier_state modification
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND tier_state = (SELECT p.tier_state FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- Allow users to delete their own trades
CREATE POLICY "Users can delete their own trades"
  ON public.trades FOR DELETE
  USING (auth.uid() = user_id);
