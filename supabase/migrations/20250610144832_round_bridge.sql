/*
  # Ensure Avatar Storage is Properly Configured

  1. Storage Setup
    - Ensure avatars bucket exists with public read access
    - Update bucket settings if needed
  
  2. Note: RLS policies for storage.objects should already be handled by previous migrations
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

-- Ensure the bucket is publicly readable
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';