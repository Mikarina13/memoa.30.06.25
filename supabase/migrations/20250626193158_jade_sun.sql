/*
  # Refactor Gallery Items Table

  1. Schema Changes
    - Remove `folder` column from gallery_items table
    - Add `sort_order` column (integer) to support manual ordering
  
  2. Purpose
    - Simplify gallery organization by removing folder categorization
    - Allow users to manually reorder gallery items
    - Provide a better user experience for gallery viewing
*/

-- Remove folder column from gallery_items
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_items' AND column_name = 'folder'
  ) THEN
    ALTER TABLE public.gallery_items DROP COLUMN folder;
  END IF;
END $$;

-- Drop folder index if it exists
DROP INDEX IF EXISTS gallery_items_folder_idx;

-- Add sort_order column to gallery_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_items' AND column_name = 'sort_order'
  ) THEN
    -- Add column with default value based on created_at timestamp
    -- Converting to epoch seconds and negate it to make newer items appear first by default
    ALTER TABLE public.gallery_items ADD COLUMN sort_order integer;

    -- Update existing records to have a sort order based on creation time
    -- Newer items will have lower numbers (appear first)
    UPDATE public.gallery_items 
    SET sort_order = -EXTRACT(EPOCH FROM created_at)::integer;

    -- Now set the default for new records
    ALTER TABLE public.gallery_items 
    ALTER COLUMN sort_order SET DEFAULT -EXTRACT(EPOCH FROM now())::integer;
  END IF;
END $$;

-- Create index on sort_order for faster ordering
CREATE INDEX IF NOT EXISTS gallery_items_sort_order_idx ON public.gallery_items(sort_order);