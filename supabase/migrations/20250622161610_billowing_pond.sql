/*
  # Fix Family Tree Storage and Document Handling

  1. Storage Bucket Updates
    - Ensure documents bucket exists with proper configuration
    - Update allowed MIME types to include all image formats
    - Set appropriate file size limits
  
  2. Storage Policies
    - Create clear, unambiguous policies for document uploads
    - Ensure proper access control for user files
    - Fix path structure handling for storage.foldername
*/

-- Update the documents bucket with expanded mime types and larger file size limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true, 
  52428800, -- 50MB limit
  ARRAY[
    -- Document formats
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    -- Image formats - explicitly include all common types
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    -- Spreadsheet formats
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    -- Presentation formats
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    -- Archive formats
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/x-bzip',
    'application/x-bzip2',
    'application/gzip',
    -- Genealogy formats
    'application/x-gedcom',
    'application/xml',
    'text/xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    -- Document formats
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    -- Image formats - explicitly include all common types
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    -- Spreadsheet formats
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    -- Presentation formats
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    -- Archive formats
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/x-bzip',
    'application/x-bzip2',
    'application/gzip',
    -- Genealogy formats
    'application/x-gedcom',
    'application/xml',
    'text/xml'
  ];

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
        AND policyname ILIKE '%document%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON storage.objects';
    END LOOP;
END $$;

-- Also drop the specific policies we know about
DROP POLICY IF EXISTS "Documents upload access" ON storage.objects;
DROP POLICY IF EXISTS "Documents update access" ON storage.objects;
DROP POLICY IF EXISTS "Documents delete access" ON storage.objects;
DROP POLICY IF EXISTS "Documents public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to documents" ON storage.objects;

-- Create new, clear policies for documents bucket
-- Policy for uploading documents (INSERT)
CREATE POLICY "Documents upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for updating documents (UPDATE)
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

-- Policy for deleting documents (DELETE)
CREATE POLICY "Documents delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for reading documents (SELECT) - public access
CREATE POLICY "Documents read policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Create models bucket if it doesn't exist (for 3D models)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models', 
  'models', 
  true, 
  104857600, -- 100MB limit
  ARRAY[
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream'
  ];

-- Create policies for models bucket
DROP POLICY IF EXISTS "Models upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Models update policy" ON storage.objects;
DROP POLICY IF EXISTS "Models delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Models read policy" ON storage.objects;

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