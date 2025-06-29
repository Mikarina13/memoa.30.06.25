/*
  # Remove Tavus integration columns

  1. Changes
    - Remove tavus_avatar_id column from profiles and memoria_profiles tables
    - Update the default integration_status JSONB value to remove Tavus entry

  2. Purpose
    - The Tavus integration is no longer needed in the application
    - Clean up the database schema to match the application's current needs
*/

-- Remove the tavus_avatar_id column from profiles table
DO $$
BEGIN
  -- Check if column exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tavus_avatar_id'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN tavus_avatar_id;
  END IF;
END $$;

-- Remove the tavus_avatar_id column from memoria_profiles table
DO $$
BEGIN
  -- Check if column exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memoria_profiles' AND column_name = 'tavus_avatar_id'
  ) THEN
    ALTER TABLE public.memoria_profiles DROP COLUMN tavus_avatar_id;
  END IF;
END $$;

-- Update the default value for integration_status in profiles table
ALTER TABLE public.profiles 
ALTER COLUMN integration_status SET DEFAULT '{
  "elevenlabs": {"status": "not_started", "voice_cloned": false, "last_updated": null},
  "gemini": {"status": "not_started", "narratives_processed": false, "last_updated": null}
}'::jsonb;

-- Update the default value for integration_status in memoria_profiles table
ALTER TABLE public.memoria_profiles 
ALTER COLUMN integration_status SET DEFAULT '{
  "elevenlabs": {"status": "not_started", "voice_cloned": false, "last_updated": null},
  "gemini": {"status": "not_started", "narratives_processed": false, "last_updated": null},
  "avaturn": {"status": "not_started", "last_updated": null, "avatar_created": false},
  "portrait_generation": {"status": "not_started", "last_updated": null, "portraits_generated": false}
}'::jsonb;

-- Update existing integration_status in profiles to remove tavus key
UPDATE profiles
SET integration_status = jsonb_strip_nulls(
  integration_status - 'tavus'
)
WHERE integration_status ? 'tavus';

-- Update existing integration_status in memoria_profiles to remove tavus key
UPDATE memoria_profiles
SET integration_status = jsonb_strip_nulls(
  integration_status - 'tavus'
)
WHERE integration_status ? 'tavus';