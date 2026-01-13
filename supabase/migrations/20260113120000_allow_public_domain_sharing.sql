-- Allow Public Domain Sharing for Clients and Contacts
-- This migration removes the 'is_public_domain' restriction, allowing ANY users
-- with the same email domain to share clients.

-- 1. Update Policies for Clients

DROP POLICY IF EXISTS "Users can view clients (Own or Domain)" ON clients;
DROP POLICY IF EXISTS "Users can update clients (Own or Domain)" ON clients;
DROP POLICY IF EXISTS "Users can delete clients (Own or Domain)" ON clients;

-- VIEW: Owner OR Same Domain (Any Domain)
CREATE POLICY "Users can view clients (Own or Domain)" ON clients
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    get_user_domain_by_id(user_id) = get_my_email_domain()
  );

-- UPDATE: Owner OR Same Domain (Any Domain)
CREATE POLICY "Users can update clients (Own or Domain)" ON clients
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    get_user_domain_by_id(user_id) = get_my_email_domain()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    get_user_domain_by_id(user_id) = get_my_email_domain()
  );

-- DELETE: Owner OR Same Domain (Any Domain)
CREATE POLICY "Users can delete clients (Own or Domain)" ON clients
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    get_user_domain_by_id(user_id) = get_my_email_domain()
  );


-- 2. Update Policies for Contacts

DROP POLICY IF EXISTS "Users can view contacts (Own or Domain)" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts (Own or Domain)" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts (Own or Domain)" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts (Own or Domain)" ON contacts;

-- VIEW
CREATE POLICY "Users can view contacts (Own or Domain)" ON contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND (
        clients.user_id = auth.uid()
        OR
        get_user_domain_by_id(clients.user_id) = get_my_email_domain()
      )
    )
  );

-- INSERT
CREATE POLICY "Users can insert contacts (Own or Domain)" ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND (
        clients.user_id = auth.uid()
        OR
        get_user_domain_by_id(clients.user_id) = get_my_email_domain()
      )
    )
  );

-- UPDATE
CREATE POLICY "Users can update contacts (Own or Domain)" ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND (
        clients.user_id = auth.uid()
        OR
        get_user_domain_by_id(clients.user_id) = get_my_email_domain()
      )
    )
  );

-- DELETE
CREATE POLICY "Users can delete contacts (Own or Domain)" ON contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = contacts.client_id
      AND (
        clients.user_id = auth.uid()
        OR
        get_user_domain_by_id(clients.user_id) = get_my_email_domain()
      )
    )
  );
