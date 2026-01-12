-- Add user_id column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Force RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Remove old permissive policies
DROP POLICY IF EXISTS "Public can view clients" ON clients;
DROP POLICY IF EXISTS "Public can insert clients" ON clients;
DROP POLICY IF EXISTS "Public can update clients" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON clients;
DROP POLICY IF EXISTS "Allow all for authenticated" ON clients;
DROP POLICY IF EXISTS "Authenticated users can manage request types" ON ticket_request_types; -- Unrelated but cleanup if needed, though better keep separate. ignoring this line.

-- Create new strict policies for Clients
-- 1. Users can view their own clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Users can insert their own clients
CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. Users can update their own clients
CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Users can delete their own clients
CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- Update Contacts RLS to follow Client ownership
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Remove old permissive policies for contacts
DROP POLICY IF EXISTS "Public can view contacts" ON contacts;
DROP POLICY IF EXISTS "Public can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Public can update contacts" ON contacts;

-- New Contacts Policies
-- View: User can view contacts if they own the client
CREATE POLICY "Users can view contacts of own clients" ON contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Insert: User can insert contacts if they own the client
CREATE POLICY "Users can insert contacts for own clients" ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Update: User can update contacts of own clients
CREATE POLICY "Users can update contacts of own clients" ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Delete: User can delete contacts of own clients
CREATE POLICY "Users can delete contacts of own clients" ON contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND clients.user_id = auth.uid()
    )
  );
