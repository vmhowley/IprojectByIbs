-- Revoke Guest Write Access

-- PROJECTS --

-- Drop potentially existing policies (from various previous migrations)
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Create projects based on role" ON projects;
DROP POLICY IF EXISTS "Users can update own projects or admins can update any" ON projects;
DROP POLICY IF EXISTS "Update projects based on role" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects or admins can delete any" ON projects;

-- Create stricter policies

CREATE POLICY "Create projects based on role" ON projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- ONLY Admin and User (Staff) can create projects
  get_auth_user_role() IN ('admin', 'user')
);

CREATE POLICY "Update projects based on role" ON projects
FOR UPDATE
TO authenticated
USING (
  -- ONLY Admin and User (Staff) can update projects
  get_auth_user_role() IN ('admin', 'user')
)
WITH CHECK (
  get_auth_user_role() IN ('admin', 'user')
);

CREATE POLICY "Delete projects based on role" ON projects
FOR DELETE
TO authenticated
USING (
  -- ONLY Admin and User (Staff) can delete projects
  get_auth_user_role() IN ('admin', 'user')
);


-- TICKETS --

-- Drop potentially existing policies
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Create tickets based on contact" ON tickets;
DROP POLICY IF EXISTS "Create tickets based on role" ON tickets;
DROP POLICY IF EXISTS "Users can update own tickets or admins can update any" ON tickets;
DROP POLICY IF EXISTS "Update tickets based on contact" ON tickets;
DROP POLICY IF EXISTS "Users can delete own tickets or admins can delete any" ON tickets;

-- Create stricter policies

CREATE POLICY "Create tickets based on role" ON tickets
FOR INSERT
TO authenticated
WITH CHECK (
  -- ONLY Admin and User (Staff) can create tickets
  get_auth_user_role() IN ('admin', 'user')
);

CREATE POLICY "Update tickets based on role" ON tickets
FOR UPDATE
TO authenticated
USING (
  -- ONLY Admin and User (Staff) can update tickets
  get_auth_user_role() IN ('admin', 'user')
)
WITH CHECK (
  get_auth_user_role() IN ('admin', 'user')
);

CREATE POLICY "Delete tickets based on role" ON tickets
FOR DELETE
TO authenticated
USING (
  -- ONLY Admin and User (Staff) can delete tickets
  get_auth_user_role() IN ('admin', 'user')
);
