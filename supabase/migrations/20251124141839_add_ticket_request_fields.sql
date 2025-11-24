/*
  # Add request fields to tickets table

  1. Schema Changes
    - Add `client` (text) - Name of the client making the request
    - Add `contact` (text) - Contact person details
    - Add `subject` (text) - Request subject/summary
    - Add `request_type` (text) - Type of request (feature, bug, support, etc.)
    - Add `forms` (jsonb) - Forms or attachments data
    
  2. Notes
    - All new fields are nullable to maintain compatibility with existing records
    - Using jsonb for forms to allow flexible form data structure
*/

-- Add new request fields to tickets table
DO $$
BEGIN
  -- Add client field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'client'
  ) THEN
    ALTER TABLE tickets ADD COLUMN client text;
  END IF;

  -- Add contact field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'contact'
  ) THEN
    ALTER TABLE tickets ADD COLUMN contact text;
  END IF;

  -- Add subject field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'subject'
  ) THEN
    ALTER TABLE tickets ADD COLUMN subject text;
  END IF;

  -- Add request_type field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'request_type'
  ) THEN
    ALTER TABLE tickets ADD COLUMN request_type text;
  END IF;

  -- Add forms field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'forms'
  ) THEN
    ALTER TABLE tickets ADD COLUMN forms jsonb;
  END IF;
END $$;

-- Create index for request_type for better filtering
CREATE INDEX IF NOT EXISTS idx_tickets_request_type ON tickets(request_type);

-- Add constraint for request_type values
DO $$
BEGIN
  ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_request_type_check;
  ALTER TABLE tickets ADD CONSTRAINT tickets_request_type_check 
    CHECK (request_type IS NULL OR request_type IN ('feature', 'bug', 'support', 'enhancement', 'documentation', 'other'));
END $$;
