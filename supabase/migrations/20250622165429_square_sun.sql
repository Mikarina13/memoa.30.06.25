/*
  # Add Folder Column to Gallery Items

  1. Changes
    - Add `folder` column to gallery_items table with default value 'Uncategorized'
    - Update existing records to use the default folder
    - Create index on folder column for faster filtering
  
  2. Purpose
    - Allow users to organize gallery items into folders
    - Improve organization and navigation of media files
    - Support filtering gallery items by folder
*/

-- Add folder column to gallery_items if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_items' AND column_name = 'folder'
  ) THEN
    ALTER TABLE public.gallery_items ADD COLUMN folder text DEFAULT 'Uncategorized';
    
    -- Update existing records to use the default folder
    UPDATE public.gallery_items SET folder = 'Uncategorized' WHERE folder IS NULL;
  END IF;
END $$;

-- Create index on folder column for faster filtering
CREATE INDEX IF NOT EXISTS gallery_items_folder_idx ON public.gallery_items(folder);