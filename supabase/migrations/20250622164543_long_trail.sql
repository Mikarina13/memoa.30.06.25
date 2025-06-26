/*
  # Add Folder Support to Gallery Items

  1. Schema Changes
    - Add `folder` column to gallery_items table
    - Set default value to 'Uncategorized'
    - Update existing records to use the default folder
  
  2. Indexing
    - Add index on folder column for faster filtering
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

-- Add folder-related policies if needed
-- (The existing policies should already cover folder access since they're based on user_id)