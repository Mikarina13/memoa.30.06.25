/*
  # Add Models Storage Bucket and Fix Document Storage

  1. Storage Setup
    - Create models bucket for storing 3D models
    - Update documents bucket to accept all file types
    - Increase file size limits for larger files
  
  2. Security Policies
    - Create policies for model management
    - Fix document storage policies
    - Ensure proper access control for all storage buckets
*/

-- Create the models bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models', 
  'models', 
  true, 
  104857600, -- 100MB limit
  ARRAY[
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
    'application/x-binary'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
    'application/x-binary'
  ];

-- Update the documents bucket to accept all file types
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'documents', 
  'documents', 
  true, 
  104857600 -- 100MB limit
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = NULL; -- Allow all file types

-- Drop existing policies for models bucket
DROP POLICY IF EXISTS "Models upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Models update policy" ON storage.objects;
DROP POLICY IF EXISTS "Models delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Models read policy" ON storage.objects;

-- Create policies for models bucket
CREATE POLICY "Models upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Models update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Models delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Models read policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'models');

-- Drop ALL existing document-related policies to avoid conflicts
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND (policyname ILIKE '%document%' OR policyname ILIKE '%doc%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON storage.objects';
    END LOOP;
END $$;

-- Create new policies for documents bucket
CREATE POLICY "Documents upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Documents update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Documents delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Documents read policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');