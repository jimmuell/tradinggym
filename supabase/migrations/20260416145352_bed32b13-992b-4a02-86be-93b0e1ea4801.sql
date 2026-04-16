-- Drop the existing permissive UPDATE policy on profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a new UPDATE policy that prevents users from modifying tier_state
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND tier_state = (SELECT p.tier_state FROM public.profiles p WHERE p.user_id = auth.uid())
  );