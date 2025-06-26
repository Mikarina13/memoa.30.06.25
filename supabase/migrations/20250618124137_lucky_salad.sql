/*
  # Create memoria_profiles table for MEMORIA module

  1. New Tables
    - `memoria_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, required)
      - `relationship` (text, optional)
      - `description` (text, optional)
      - `birth_date` (date, optional)
      - `death_date` (date, optional)
      - `is_celebrity` (boolean, default false)
      - `profile_data` (jsonb, default empty object)
      - `elevenlabs_voice_id` (text, optional)
      - `tavus_avatar_id` (text, optional)
      - `integration_status` (jsonb, with default status structure)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `memoria_profiles` table
    - Add policies for authenticated users to manage their own profiles
    - Users can only access profiles they created

  3. Indexes
    - Index on user_id for faster lookups

  4. Triggers
    - Auto-update updated_at timestamp on changes
*/

-- Create memoria_profiles table
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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS memoria_profiles_user_id_idx ON memoria_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE memoria_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own memoria profiles"
  ON memoria_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memoria profiles"
  ON memoria_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memoria profiles"
  ON memoria_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own memoria profiles"
  ON memoria_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at (assuming handle_updated_at function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE TRIGGER handle_memoria_profiles_updated_at
      BEFORE UPDATE ON memoria_profiles
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;