-- Update Clients RLS to allow Domain-Based Access

-- We rely on existing helper functions:
-- get_email_domain(email)
-- is_public_domain(domain)
-- get_my_email_domain()
-- get_user_domain_by_id(user_id)

-- 1. Drop strict "owner only" policies
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

-- 2. Create Domain-Aware Policies for Clients

-- VIEW: Owner OR Same Corporate Domain
CREATE POLICY "Users can view clients (Own or Domain)" ON clients
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      -- Not a public domain (gmail, etc)
      NOT is_public_domain(get_my_email_domain()) 
      AND 
      -- Creator has same domain as me
      get_user_domain_by_id(user_id) = get_my_email_domain()
    )
  );

-- INSERT: Owner only (standard)
CREATE POLICY "Users can insert clients" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Owner OR Same Corporate Domain
CREATE POLICY "Users can update clients (Own or Domain)" ON clients
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      NOT is_public_domain(get_my_email_domain()) 
      AND 
      get_user_domain_by_id(user_id) = get_my_email_domain()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (
      NOT is_public_domain(get_my_email_domain()) 
      AND 
      get_user_domain_by_id(user_id) = get_my_email_domain()
    )
  );

-- DELETE: Owner OR Same Corporate Domain
CREATE POLICY "Users can delete clients (Own or Domain)" ON clients
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      NOT is_public_domain(get_my_email_domain()) 
      AND 
      get_user_domain_by_id(user_id) = get_my_email_domain()
    )
  );


-- 3. Update Contacts Policies (Inherit from Client)
-- We need to refresh these to ensure they use the new Client visibility logic implicit in the subquery?
-- Actually, the previous policies used: EXISTS (SELECT 1 FROM clients WHERE clients.id = contacts.client_id AND clients.user_id = auth.uid())
-- We need to change that to general "can I see this client?" (USING RLS) or repeat the logic.
-- Using RLS recursion in policies can be tricky/perf costly. Safest is to repeat logic or check if client is visible.
-- Let's repeat the domain logic for robustness.

DROP POLICY IF EXISTS "Users can view contacts of own clients" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts for own clients" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts of own clients" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts of own clients" ON contacts;

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
        (
          NOT is_public_domain(get_my_email_domain()) 
          AND 
          get_user_domain_by_id(clients.user_id) = get_my_email_domain()
        )
      )
    )
  );

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
        (
          NOT is_public_domain(get_my_email_domain()) 
          AND 
          get_user_domain_by_id(clients.user_id) = get_my_email_domain()
        )
      )
    )
  );

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
        (
          NOT is_public_domain(get_my_email_domain()) 
          AND 
          get_user_domain_by_id(clients.user_id) = get_my_email_domain()
        )
      )
    )
  );

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
        (
          NOT is_public_domain(get_my_email_domain()) 
          AND 
          get_user_domain_by_id(clients.user_id) = get_my_email_domain()
        )
      )
    )
  );
