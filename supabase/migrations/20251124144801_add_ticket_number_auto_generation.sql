/*
  # Add automatic ticket number generation

  1. Changes
    - Create function to generate unique ticket numbers
    - Add trigger to automatically set ticket_number on insert
    - Make ticket_number nullable temporarily for existing records
    
  2. Details
    - Ticket numbers follow format: TKT-XXXX (e.g., TKT-0001, TKT-0002)
    - Numbers are auto-incremented per project
    - Existing tickets without numbers will be updated
*/

-- First, make ticket_number nullable temporarily
ALTER TABLE tickets ALTER COLUMN ticket_number DROP NOT NULL;

-- Create sequence for ticket numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
  new_ticket_number text;
BEGIN
  -- Only generate if ticket_number is not provided
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    -- Get the next number for this project
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'TKT-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM tickets
    WHERE project_id = NEW.project_id;
    
    -- Format as TKT-XXXX
    new_ticket_number := 'TKT-' || LPAD(next_num::text, 4, '0');
    NEW.ticket_number := new_ticket_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket number
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON tickets;
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- Update existing tickets without ticket_number
DO $$
DECLARE
  ticket_record RECORD;
  next_num integer;
  new_ticket_number text;
BEGIN
  FOR ticket_record IN 
    SELECT id, project_id 
    FROM tickets 
    WHERE ticket_number IS NULL OR ticket_number = ''
    ORDER BY created_at
  LOOP
    -- Get next number for this project
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'TKT-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM tickets
    WHERE project_id = ticket_record.project_id
      AND ticket_number IS NOT NULL 
      AND ticket_number != '';
    
    -- Format and update
    new_ticket_number := 'TKT-' || LPAD(next_num::text, 4, '0');
    UPDATE tickets 
    SET ticket_number = new_ticket_number 
    WHERE id = ticket_record.id;
  END LOOP;
END $$;

-- Now make ticket_number NOT NULL again with a default
ALTER TABLE tickets ALTER COLUMN ticket_number SET DEFAULT '';
ALTER TABLE tickets ALTER COLUMN ticket_number SET NOT NULL;
