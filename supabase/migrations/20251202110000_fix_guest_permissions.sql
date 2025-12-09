-- Function to get user role (helper for RLS)
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS text AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Update Projects Policies

DROP POLICY IF EXISTS "View projects based on contact" ON projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;

CREATE POLICY "View projects based on role" ON projects
FOR SELECT
TO authenticated
USING (
  -- Admin and User (Staff) can view all projects
  (get_auth_user_role() IN ('admin', 'user'))
  OR
  -- Guests can ONLY view projects for their linked client
  (
    get_auth_user_role() = 'guest'
    AND
    get_auth_user_client_id() IS NOT NULL
    AND
    client_id = get_auth_user_client_id()
  )
);

-- Update Tickets Policies

DROP POLICY IF EXISTS "View tickets based on contact" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON tickets;

CREATE POLICY "View tickets based on role" ON tickets
FOR SELECT
TO authenticated
USING (
  -- Admin and User (Staff) can view all tickets
  (get_auth_user_role() IN ('admin', 'user'))
  OR
  -- Guests can ONLY view tickets for their linked client
  (
    get_auth_user_role() = 'guest'
    AND
    get_auth_user_client_id() IS NOT NULL
    AND
    client_id = get_auth_user_client_id()
  )
);

-- Ensure Guests cannot create/update/delete projects (already covered by existing policies usually, but reinforcing)
-- Existing policies for INSERT/UPDATE/DELETE on projects usually check for admin or creator, or specific roles.
-- We'll leave those as they are usually more restrictive (e.g. only admins can delete).
-- But we should check "Create tickets based on contact" to ensure it respects the role too.

DROP POLICY IF EXISTS "Create tickets based on contact" ON tickets;

CREATE POLICY "Create tickets based on role" ON tickets
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin and User can create for any client (or no client)
  (get_auth_user_role() IN ('admin', 'user'))
  OR
  -- Guests can ONLY create for their linked client
  (
    get_auth_user_role() = 'guest'
    AND
    get_auth_user_client_id() IS NOT NULL
    AND
    client_id = get_auth_user_client_id()
  )
);
