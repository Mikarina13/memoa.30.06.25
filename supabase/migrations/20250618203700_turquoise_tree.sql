/*
  # Fix Memoria Profiles Table and Policies

  1. New Tables
    - Ensures `memoria_profiles` table exists
  2. Security
    - Enables RLS on `memoria_profiles` table
    - Adds policies for authenticated users to manage their own profiles
  3. Indexing
    - Creates index on user_id for faster lookups
*/

-- Create memoria_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS memoria_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  description text,
  birth_date date,
  death_date date,
  is_celebrity boolean DEFAULT false,
  profile_data jsonb DEFAULT '{}'::jsonb,
  elevenlabs_voice_id text,
  tavus_avatar_id text,
  integration_status jsonb DEFAULT '{
    "elevenlabs": {"status": "not_started", "last_updated": null, "voice_cloned": false},
    "tavus": {"status": "not_started", "last_updated": null, "avatar_created": false},
    "gemini": {"status": "not_started", "last_updated": null, "narratives_processed": false},
    "avaturn": {"status": "not_started", "last_updated": null, "avatar_created": false},
    "portrait_generation": {"status": "not_started", "last_updated": null, "portraits_generated": false}
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS memoria_profiles_user_id_idx ON memoria_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE memoria_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memoria_profiles' 
    AND policyname = 'Users can insert their own memoria profiles'
  ) THEN
    CREATE POLICY "Users can insert their own memoria profiles"
      ON memoria_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memoria_profiles' 
    AND policyname = 'Users can update their own memoria profiles'
  ) THEN
    CREATE POLICY "Users can update their own memoria profiles"
      ON memoria_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memoria_profiles' 
    AND policyname = 'Users can delete their own memoria profiles'
  ) THEN
    CREATE POLICY "Users can delete their own memoria profiles"
      ON memoria_profiles
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memoria_profiles' 
    AND policyname = 'Users can view their own memoria profiles'
  ) THEN
    CREATE POLICY "Users can view their own memoria profiles"
      ON memoria_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') AND
     NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_memoria_profiles_updated_at') THEN
    CREATE TRIGGER handle_memoria_profiles_updated_at
      BEFORE UPDATE ON memoria_profiles
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;