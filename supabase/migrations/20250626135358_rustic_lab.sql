/*
  # Add privacy columns to profiles table

  1. New Columns
    - `show_email` (boolean, default false) - Controls whether user's email is visible to others
    - `show_phone` (boolean, default false) - Controls whether user's phone number is visible to others

  2. Changes
    - Add privacy control columns to existing profiles table
    - Set default values to false for privacy protection

  3. Security
    - No changes to RLS policies needed - these are user-controlled privacy settings
*/

-- Add show_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_email boolean DEFAULT false;
  END IF;
END $$;

-- Add show_phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_phone boolean DEFAULT false;
  END IF;
END $$;

-- Add indexes for privacy columns (optional but good for performance)
CREATE INDEX IF NOT EXISTS profiles_show_email_idx ON profiles (show_email) WHERE show_email = true;
CREATE INDEX IF NOT EXISTS profiles_show_phone_idx ON profiles (show_phone) WHERE show_phone = true;