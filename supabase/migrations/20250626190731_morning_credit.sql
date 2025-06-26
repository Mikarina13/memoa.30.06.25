/*
  # Fix Gallery Items Visibility in Memento Explorer
  
  1. Policy Updates
    - Replace the existing SELECT policy for gallery_items to allow viewing items from public profiles
    
  2. Purpose
    - Enable users to see gallery items when viewing another user's public profile
    - Fix issue where gallery items from one profile show up in another profile
    - Ensure correct visibility of galleries in the Memento explorer
*/

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own gallery items" ON public.gallery_items;

-- Create a comprehensive policy for viewing gallery items
CREATE POLICY "Users can view gallery items"
  ON public.gallery_items
  FOR SELECT
  TO public
  USING (
    -- Users can see their own gallery items
    (auth.uid() = user_id)
    OR
    -- Public users can see gallery items from public Memoir profiles
    -- (when memoriaProfileId is NULL and the owner's profile is public)
    (
      (metadata->>'memoriaProfileId') IS NULL 
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = gallery_items.user_id
        AND p.is_public = true
      )
    )
    OR
    -- Public users can see gallery items from public Memoria profiles
    -- (when memoriaProfileId exists and the corresponding memoria_profile is public)
    (
      (metadata->>'memoriaProfileId') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM memoria_profiles mp
        WHERE mp.id = (metadata->>'memoriaProfileId')::uuid
        AND mp.is_public = true
      )
    )
  );