/*
  # Add sort_order to gallery_items

  1. Schema Changes
    - Add `sort_order` integer column to gallery_items table
    - Create index on sort_order column for faster sorting queries
    - Initialize existing records with timestamps for sorting

  2. Changes
    - This allows manual reordering of gallery items
    - Default to a negative timestamp (newer items first)
    - Sets up database for drag-and-drop reordering UI
*/

-- Add sort_order column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_items' AND column_name = 'sort_order'
  ) THEN
    -- Add the column
    ALTER TABLE public.gallery_items ADD COLUMN sort_order integer DEFAULT (- (EXTRACT(epoch FROM now()))::integer);
    
    -- Set values for existing records based on created_at in reverse order (newest first)
    UPDATE public.gallery_items 
    SET sort_order = (- (EXTRACT(epoch FROM created_at))::integer)
    WHERE sort_order IS NULL;
  END IF;
END $$;

-- Create index on sort_order column for faster sorting queries
CREATE INDEX IF NOT EXISTS gallery_items_sort_order_idx ON public.gallery_items(sort_order);