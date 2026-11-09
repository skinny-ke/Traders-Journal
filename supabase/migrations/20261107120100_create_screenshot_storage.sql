-- Private screenshot bucket and authenticated-only storage policies.
-- Files are organized as: {user_id}/{trade_id}/{filename}
-- Do not make this bucket public. Do not add anonymous storage policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-screenshots',
  'trade-screenshots',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can upload own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own screenshots" ON storage.objects;

CREATE POLICY "Authenticated users can upload own screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Authenticated users can read own screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Authenticated users can update own screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Authenticated users can delete own screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);
