CREATE OR REPLACE FUNCTION public.get_profiles_by_user_ids(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url
  FROM profiles p
  WHERE p.user_id = ANY(user_ids);
$$;