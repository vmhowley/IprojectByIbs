/*
  # Add ticket attachments support

  1. Changes
    - Add `attachments` column to tickets table to store file metadata
    
  2. Details
    - Attachments stored as JSONB array with file info (name, url, size, type)
    - Format: [{"name": "file.pdf", "url": "...", "size": 1024, "type": "application/pdf"}]
*/

-- Add attachments column to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE tickets ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
