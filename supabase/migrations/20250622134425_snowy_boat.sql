/*
  # Fix Document Storage for Family Tree Images

  1. Storage Setup
    - Update documents bucket configuration
    - Add support for all image formats
    - Increase file size limit for larger documents
  
  2. Security Policies
    - Ensure proper access control for documents
    - Allow public read access for shared documents
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
    'application/gzip'
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
    'application/gzip'
  ];

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to documents" ON storage.objects;

-- Policy for uploading documents (INSERT)
CREATE POLICY "Documents upload access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for updating documents (UPDATE)
CREATE POLICY "Documents update access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for deleting documents (DELETE)
CREATE POLICY "Documents delete access"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for reading documents (SELECT) - public access
CREATE POLICY "Documents public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');