/*
  # Create Documents Storage Bucket

  1. Storage Setup
    - Create documents bucket for storing PDFs and other document files
    - Set file size limits and allowed MIME types
  
  2. Security Policies
    - Create policies for document management
    - Allow authenticated users to upload/update/delete their own documents
    - Allow public read access to all documents
*/

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true, 
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to documents" ON storage.objects;

-- Policy for uploading documents (INSERT)
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for updating documents (UPDATE)
CREATE POLICY "Allow authenticated users to update own documents"
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
CREATE POLICY "Allow authenticated users to delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for reading documents (SELECT) - public access
CREATE POLICY "Allow public read access to documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');