/*
  # Fix Avatar Storage RLS Policies

  1. Storage Bucket Setup
    - Ensure avatars bucket exists with proper configuration
    - Set file size limits and allowed MIME types
  
  2. RLS Policies
    - Drop all existing avatar-related policies
    - Create new policies for upload, read, update, delete
    - Use correct path structure: avatars/{user_id}/filename
*/

-- Ensure the avatars bucket exists and is configured correctly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop ALL existing avatar-related policies to avoid conflicts
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname ILIKE '%avatar%'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON storage.objects';
    END LOOP;
END $$;

-- Also drop the specific policies we know about
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Policy for uploading avatars (INSERT)
-- Path structure: {user_id}/filename in avatars bucket
CREATE POLICY "Avatar upload access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for reading avatars (SELECT) - public access for display
CREATE POLICY "Avatar public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy for updating avatars (UPDATE)
CREATE POLICY "Avatar update access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for deleting avatars (DELETE)
CREATE POLICY "Avatar delete access"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);