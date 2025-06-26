/*
  # Add Public Profile Functionality

  1. Schema Updates
    - Add `is_public` boolean column to profiles table (for MEMOIR)
    - Add `is_public` boolean column to memoria_profiles table (for MEMORIA)
    - Default value is false (private) for both tables
  
  2. Security
    - Update RLS policies to allow public viewing of profiles marked as public
    - Keep existing policies for authenticated user access
  
  3. Purpose
    - Allow users to make their profiles discoverable in the Memento explorer
    - Enable social features like favoriting other users' profiles
    - Maintain privacy control for users who wish to keep their profiles private
*/

-- Add is_public column to profiles table (for MEMOIR)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

-- Add is_public column to memoria_profiles table (for MEMORIA)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memoria_profiles' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.memoria_profiles ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

-- Create a policy for public access to public profiles (MEMOIR)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Public can view public profiles'
  ) THEN
    CREATE POLICY "Public can view public profiles"
      ON public.profiles
      FOR SELECT
      TO public
      USING (is_public = true);
  END IF;
END $$;

-- Create a policy for public access to public memoria profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memoria_profiles' 
    AND policyname = 'Public can view public memoria profiles'
  ) THEN
    CREATE POLICY "Public can view public memoria profiles"
      ON public.memoria_profiles
      FOR SELECT
      TO public
      USING (is_public = true);
  END IF;
END $$;

-- Create favorites table to store user favorite profiles
CREATE TABLE IF NOT EXISTS public.profile_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  profile_type text NOT NULL, -- 'memoir' or 'memoria'
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id, profile_type)
);

-- Enable RLS on profile_favorites table
ALTER TABLE public.profile_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_favorites
CREATE POLICY "Users can insert their own favorites"
  ON public.profile_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.profile_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own favorites"
  ON public.profile_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profile_favorites_user_id_idx ON public.profile_favorites(user_id);
CREATE INDEX IF NOT EXISTS profile_favorites_profile_id_idx ON public.profile_favorites(profile_id);
CREATE INDEX IF NOT EXISTS profiles_is_public_idx ON public.profiles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS memoria_profiles_is_public_idx ON public.memoria_profiles(is_public) WHERE is_public = true;