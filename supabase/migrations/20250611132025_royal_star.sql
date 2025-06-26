/*
  # Create Memorial Space System

  1. New Tables
    - `memorial_spaces` - Stores memorial space configurations and metadata
    - `memory_points` - Interactive points within memorial spaces
    - `memorial_assets` - 3D models, images, videos uploaded by users
    - `space_templates` - Pre-built environment templates

  2. Storage Buckets
    - memorial-models: For GLB/GLTF 3D model files
    - memorial-media: For photos, videos, and other media
    - memorial-thumbnails: For space preview images

  3. Security
    - Enable RLS on all new tables
    - Create appropriate policies for memorial space management
*/

-- Create memorial_spaces table
CREATE TABLE IF NOT EXISTS public.memorial_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  environment_template text DEFAULT 'peaceful_garden',
  space_data jsonb DEFAULT '{}'::jsonb,
  is_published boolean DEFAULT false,
  is_public boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Create memory_points table
CREATE TABLE IF NOT EXISTS public.memory_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_space_id uuid REFERENCES public.memorial_spaces(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  position_x real NOT NULL DEFAULT 0,
  position_y real NOT NULL DEFAULT 0,
  position_z real NOT NULL DEFAULT 0,
  point_type text NOT NULL DEFAULT 'text', -- 'text', 'voice', 'photo', 'video', 'model'
  content jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create memorial_assets table
CREATE TABLE IF NOT EXISTS public.memorial_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memorial_space_id uuid REFERENCES public.memorial_spaces(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  asset_type text NOT NULL, -- 'model', 'image', 'video', 'audio'
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create space_templates table
CREATE TABLE IF NOT EXISTS public.space_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  thumbnail_url text,
  environment_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memorial_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_templates ENABLE ROW LEVEL SECURITY;

-- Memorial Spaces Policies
CREATE POLICY "Users can view own memorial spaces"
  ON public.memorial_spaces
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view published public memorial spaces"
  ON public.memorial_spaces
  FOR SELECT
  TO public
  USING (is_published = true AND is_public = true);

CREATE POLICY "Users can insert own memorial spaces"
  ON public.memorial_spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memorial spaces"
  ON public.memorial_spaces
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memorial spaces"
  ON public.memorial_spaces
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Memory Points Policies
CREATE POLICY "Users can view memory points of accessible spaces"
  ON public.memory_points
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memorial_spaces ms 
      WHERE ms.id = memorial_space_id 
      AND (ms.user_id = auth.uid() OR (ms.is_published = true AND ms.is_public = true))
    )
  );

CREATE POLICY "Users can manage memory points of own spaces"
  ON public.memory_points
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memorial_spaces ms 
      WHERE ms.id = memorial_space_id 
      AND ms.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memorial_spaces ms 
      WHERE ms.id = memorial_space_id 
      AND ms.user_id = auth.uid()
    )
  );

-- Memorial Assets Policies
CREATE POLICY "Users can view own memorial assets"
  ON public.memorial_assets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view template assets"
  ON public.memorial_assets
  FOR SELECT
  TO authenticated
  USING (is_template = true);

CREATE POLICY "Users can insert own memorial assets"
  ON public.memorial_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memorial assets"
  ON public.memorial_assets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memorial assets"
  ON public.memorial_assets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Space Templates Policies
CREATE POLICY "Everyone can view active templates"
  ON public.space_templates
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS memorial_spaces_user_id_idx ON public.memorial_spaces(user_id);
CREATE INDEX IF NOT EXISTS memorial_spaces_published_idx ON public.memorial_spaces(is_published, is_public) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS memory_points_space_id_idx ON public.memory_points(memorial_space_id);
CREATE INDEX IF NOT EXISTS memorial_assets_user_id_idx ON public.memorial_assets(user_id);
CREATE INDEX IF NOT EXISTS memorial_assets_space_id_idx ON public.memorial_assets(memorial_space_id);
CREATE INDEX IF NOT EXISTS memorial_assets_template_idx ON public.memorial_assets(is_template) WHERE is_template = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_memorial_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER handle_memorial_spaces_updated_at
  BEFORE UPDATE ON public.memorial_spaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_memorial_updated_at();

CREATE TRIGGER handle_memory_points_updated_at
  BEFORE UPDATE ON public.memory_points
  FOR EACH ROW EXECUTE FUNCTION public.handle_memorial_updated_at();

-- Insert default space templates
INSERT INTO public.space_templates (name, description, environment_data) VALUES
  ('Peaceful Garden', 'A serene garden setting with flowers and gentle lighting', '{"environment": "garden", "lighting": "soft", "objects": ["flowers", "bench", "fountain"]}'),
  ('Memorial Hall', 'A dignified indoor space with elegant architecture', '{"environment": "hall", "lighting": "warm", "objects": ["pillars", "altar", "candles"]}'),
  ('Starlit Void', 'A cosmic space among the stars for eternal remembrance', '{"environment": "space", "lighting": "cosmic", "objects": ["stars", "nebula", "floating_platform"]}'),
  ('Cozy Living Room', 'A warm, familiar living space filled with memories', '{"environment": "indoor", "lighting": "cozy", "objects": ["sofa", "bookshelf", "fireplace"]}'),
  ('Nature Sanctuary', 'A natural outdoor setting with trees and wildlife', '{"environment": "forest", "lighting": "natural", "objects": ["trees", "wildlife", "stream"]}')
ON CONFLICT DO NOTHING;

-- Create storage buckets for memorial assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('memorial-models', 'memorial-models', true, 52428800, ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']),
  ('memorial-media', 'memorial-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg']),
  ('memorial-thumbnails', 'memorial-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for memorial-models bucket
CREATE POLICY "Users can upload memorial models"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memorial-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own memorial models"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'memorial-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'memorial-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own memorial models"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'memorial-models' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view memorial models"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'memorial-models');

-- Storage policies for memorial-media bucket
CREATE POLICY "Users can upload memorial media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memorial-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own memorial media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'memorial-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'memorial-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own memorial media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'memorial-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view memorial media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'memorial-media');

-- Storage policies for memorial-thumbnails bucket
CREATE POLICY "Users can upload memorial thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memorial-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own memorial thumbnails"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'memorial-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'memorial-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own memorial thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'memorial-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view memorial thumbnails"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'memorial-thumbnails');