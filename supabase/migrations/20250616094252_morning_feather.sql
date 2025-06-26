/*
  # Add Gallery System

  1. New Tables
    - `gallery_items` - Stores metadata for user-uploaded media files
  
  2. Storage Buckets
    - gallery: For storing user-uploaded media files
  
  3. Security
    - Enable RLS on all new tables
    - Create appropriate policies for gallery management
*/

-- Create gallery_items table
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  media_type text NOT NULL, -- 'image', 'video', 'audio', 'document', 'other'
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  thumbnail_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Gallery Items Policies
CREATE POLICY "Users can view own gallery items"
  ON public.gallery_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gallery items"
  ON public.gallery_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gallery items"
  ON public.gallery_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gallery items"
  ON public.gallery_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS gallery_items_user_id_idx ON public.gallery_items(user_id);
CREATE INDEX IF NOT EXISTS gallery_items_media_type_idx ON public.gallery_items(media_type);
CREATE INDEX IF NOT EXISTS gallery_items_tags_idx ON public.gallery_items USING gin(tags);

-- Create trigger for updating updated_at
CREATE TRIGGER handle_gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery', 
  'gallery', 
  true, 
  104857600, -- 100MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/ogg', 'audio/wav',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/ogg', 'audio/wav',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

-- Storage policies for gallery bucket
CREATE POLICY "Users can upload gallery files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own gallery files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own gallery files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view gallery files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gallery');