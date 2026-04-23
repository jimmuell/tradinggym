
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-assets', 'lesson-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "guru_upload_own" ON storage.objects;
CREATE POLICY "guru_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "guru_delete_own_lesson_assets" ON storage.objects;
CREATE POLICY "guru_delete_own_lesson_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "authenticated_read_lesson_assets" ON storage.objects;
CREATE POLICY "authenticated_read_lesson_assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-assets');
