
-- Entitlement function for guru class media in lesson-assets-private.
-- Takes _user_id explicitly so it works when called by a service-role client
-- (auth.uid() would be NULL in that context).
CREATE OR REPLACE FUNCTION public.can_access_guru_asset(
  _user_id uuid,
  _path    text
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_escaped  text;
BEGIN
  IF _user_id IS NULL OR _path IS NULL OR _path = '' THEN
    RETURN false;
  END IF;

  -- (a) Owner of the folder wins (guru editing own material).
  IF (string_to_array(_path, '/'))[1] = _user_id::text THEN
    RETURN true;
  END IF;

  -- (b) Authoritative check: locate the guru lesson whose slides JSON
  -- references this exact path via the stable "private://<path>" marker.
  -- Escape LIKE metacharacters so filenames containing %/_ still match
  -- literally and a crafted path cannot wildcard the pattern.
  v_escaped := replace(replace(replace(_path, '\', '\\'), '%', '\%'), '_', '\_');

  SELECT l.class_id
  INTO v_class_id
  FROM public.lessons l
  WHERE l.content_type = 'guru'
    AND l.is_published = true
    AND l.slides::text LIKE '%"private://' || v_escaped || '"%' ESCAPE '\'
  LIMIT 1;

  IF v_class_id IS NULL THEN
    RETURN false;
  END IF;

  -- (c) Active enrollment in the owning class.
  RETURN EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    WHERE ce.class_id = v_class_id
      AND ce.student_id = _user_id
      AND ce.status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_guru_asset(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.can_access_guru_asset(uuid, text) TO service_role;

-- RLS policies on storage.objects for lesson-assets-private.
-- Reads are DENIED to anon/authenticated at the RLS layer; all reads must go
-- through the sign-guru-asset edge function which mints short-lived signed URLs
-- after calling can_access_guru_asset via service-role.

CREATE POLICY "guru_private_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-assets-private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "guru_private_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lesson-assets-private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'lesson-assets-private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "guru_private_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lesson-assets-private'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- No SELECT policy for anon/authenticated on lesson-assets-private:
-- direct reads are blocked; only service_role (edge function) reads objects,
-- and only to mint a signed URL after entitlement passes.
