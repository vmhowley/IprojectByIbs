-- ==============================================================================
-- COMPREHENSIVE SECURITY CLEANUP
-- ==============================================================================
-- Goal: Secure comments, isolate public domains, and protect project members.

-- 1. SECURE COMMENTS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON comments;
DROP POLICY IF EXISTS "Enable insert access for all users" ON comments;
DROP POLICY IF EXISTS "Enable update access for all users" ON comments;
DROP POLICY IF EXISTS "Enable delete access for all users" ON comments;

-- SELECT: Can see comment if can see the ticket
CREATE POLICY "View comments of accessible tickets" ON comments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = comments.ticket_id
  )
);

-- INSERT: Can add comment if can see the ticket
CREATE POLICY "Create comments on accessible tickets" ON comments
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = comments.ticket_id
  )
);

-- UPDATE/DELETE: Only author or Support Agent
CREATE POLICY "Manage own comments" ON comments
FOR ALL TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles 
    WHERE id = auth.uid() 
    AND (user_name = name OR public.is_support_staff())
  )
  -- Note: user_name in comments is text, mapping it to auth.uid() is safer via a user_id column.
  -- Since we don't have a user_id column in comments yet, let's add it for proper security.
);

-- Adding user_id to comments for robust RLS if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'user_id') THEN
    ALTER TABLE comments ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

-- Update existing comments to match user_id if possible (best effort based on name)
-- Skipping update as it might be unreliable, but new comments will be secure.

-- Re-create Manage policy using user_id
DROP POLICY IF EXISTS "Manage own comments" ON comments;
CREATE POLICY "Manage own comments" ON comments
FOR ALL TO authenticated
USING (
  auth.uid() = user_id OR public.is_support_staff()
)
WITH CHECK (
  auth.uid() = user_id OR public.is_support_staff()
);

-- 2. SECURE CLIENTS & CONTACTS (RE-INTRODUCE DOMAIN ISOLATION)
-- ------------------------------------------------------------------------------
-- Re-defining visibility to EXCLUDE public domains from automatic sharing.

-- CLIENTS
DROP POLICY IF EXISTS "Users can view clients (Own or Domain)" ON clients;
CREATE POLICY "Secure view clients" ON clients
FOR SELECT TO authenticated
USING (
  public.is_support_staff()
  OR
  user_id = auth.uid()
  OR
  (
    NOT public.is_public_domain(public.get_my_email_domain())
    AND
    public.get_user_domain_by_id(user_id) = public.get_my_email_domain()
  )
);

DROP POLICY IF EXISTS "Users can update clients (Own or Domain)" ON clients;
CREATE POLICY "Secure update clients" ON clients
FOR UPDATE TO authenticated
USING (
  public.is_support_staff()
  OR
  user_id = auth.uid()
  OR
  (
    NOT public.is_public_domain(public.get_my_email_domain())
    AND
    public.get_user_domain_by_id(user_id) = public.get_my_email_domain()
  )
);

DROP POLICY IF EXISTS "Users can delete clients (Own or Domain)" ON clients;
CREATE POLICY "Secure delete clients" ON clients
FOR DELETE TO authenticated
USING (
  public.is_support_staff()
  OR
  user_id = auth.uid()
);

-- CONTACTS
DROP POLICY IF EXISTS "Users can view contacts (Own or Domain)" ON contacts;
CREATE POLICY "Secure view contacts" ON contacts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = contacts.client_id
    AND (
      public.is_support_staff()
      OR
      clients.user_id = auth.uid()
      OR
      (
        NOT public.is_public_domain(public.get_my_email_domain())
        AND
        public.get_user_domain_by_id(clients.user_id) = public.get_my_email_domain()
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can insert contacts (Own or Domain)" ON contacts;
CREATE POLICY "Secure insert contacts" ON contacts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = contacts.client_id
    AND (
      public.is_support_staff()
      OR
      clients.user_id = auth.uid()
      OR
      (
        NOT public.is_public_domain(public.get_my_email_domain())
        AND
        public.get_user_domain_by_id(clients.user_id) = public.get_my_email_domain()
      )
    )
  )
);

-- 3. SECURE PROJECT MEMBERS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can see their own project team
DROP POLICY IF EXISTS "Project team visibility" ON project_members;
CREATE POLICY "Project team visibility" ON project_members
FOR SELECT TO authenticated
USING (
  public.is_support_staff()
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND (
      projects.created_by = auth.uid()
      OR
      public.is_tenant_admin() AND public.get_user_domain_by_id(projects.created_by) = public.get_my_email_domain()
      OR
      EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid())
    )
  )
);

-- INSERT/DELETE: Only Owners, Domain Admins or Support Staff
CREATE POLICY "Manage project members" ON project_members
FOR ALL TO authenticated
USING (
  public.is_support_staff()
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND (
      projects.created_by = auth.uid()
      OR
      (public.is_tenant_admin() AND public.get_user_domain_by_id(projects.created_by) = public.get_my_email_domain())
    )
  )
)
WITH CHECK (
  public.is_support_staff()
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND (
      projects.created_by = auth.uid()
      OR
      (public.is_tenant_admin() AND public.get_user_domain_by_id(projects.created_by) = public.get_my_email_domain())
    )
  )
);

-- 4. INSERT GUARDRAILS FOR PROJECTS AND TICKETS
-- ------------------------------------------------------------------------------

-- PROJECTS: Ensure created_by is the user (unless support staff)
DROP POLICY IF EXISTS "Secure insert projects" ON projects;
CREATE POLICY "Secure insert projects" ON projects
FOR INSERT TO authenticated
WITH CHECK (
  public.is_support_staff()
  OR
  created_by = auth.uid()
);

-- TICKETS: Ensure created_by is the user (unless support staff)
DROP POLICY IF EXISTS "Secure insert tickets" ON tickets;
CREATE POLICY "Secure insert tickets" ON tickets
FOR INSERT TO authenticated
WITH CHECK (
  public.is_support_staff()
  OR
  created_by = auth.uid()
);
