-- Update RLS policies for ticket_request_types to allow all authenticated users (clients) to manage them

-- Drop existing strict policy if it exists (using DO block to avoid error if not exists or name mismatch)
DROP POLICY IF EXISTS "Admins can manage request types" ON ticket_request_types;

-- Create new permissive policy for all authenticated users
CREATE POLICY "Authenticated users can manage request types" ON ticket_request_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
