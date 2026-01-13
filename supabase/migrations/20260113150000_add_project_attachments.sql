/*
  # Add project attachments support

  1. Changes
    - Add `attachments` column to projects table to store file metadata
    
  2. Details
    - Attachments stored as JSONB array with file info (name, url, size, type)
    - Format: [{"name": "file.pdf", "url": "...", "size": 1024, "type": "application/pdf"}]
*/

-- Add attachments column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE projects ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
