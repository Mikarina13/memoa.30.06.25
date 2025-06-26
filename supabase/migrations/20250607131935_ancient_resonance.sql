/*
  # Add ElevenLabs and Tavus Integration Support

  1. New Columns
    - `elevenlabs_voice_id` (text) - Stores the unique ID of user's cloned voice from ElevenLabs
    - `tavus_avatar_id` (text) - Stores the unique ID of user's visual avatar from Tavus
    - `memoir_data` (jsonb) - Stores structured memoir content including narratives, preferences, and metadata
    - `integration_status` (jsonb) - Tracks the status of various integrations (ElevenLabs, Tavus, etc.)
    - `created_at` (timestamp) - When the profile was created
    - `updated_at` (timestamp) - When the profile was last updated

  2. Security
    - Enable RLS on profiles table
    - Add policies for authenticated users to manage their own profiles

  3. Indexes
    - Add indexes for better query performance on user_id and integration IDs
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns for memoir integrations
DO $$
BEGIN
  -- Add ElevenLabs voice ID column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'elevenlabs_voice_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN elevenlabs_voice_id text;
  END IF;

  -- Add Tavus avatar ID column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tavus_avatar_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN tavus_avatar_id text;
  END IF;

  -- Add memoir data column for storing structured content
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'memoir_data'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN memoir_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add integration status tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'integration_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN integration_status jsonb DEFAULT '{
      "elevenlabs": {"status": "not_started", "voice_cloned": false, "last_updated": null},
      "tavus": {"status": "not_started", "avatar_created": false, "last_updated": null},
      "gemini": {"status": "not_started", "narratives_processed": false, "last_updated": null}
    }'::jsonb;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_elevenlabs_voice_id_idx ON public.profiles(elevenlabs_voice_id) WHERE elevenlabs_voice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_tavus_avatar_id_idx ON public.profiles(tavus_avatar_id) WHERE tavus_avatar_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_integration_status_idx ON public.profiles USING gin(integration_status);