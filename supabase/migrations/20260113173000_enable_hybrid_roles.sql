-- Enable Hybrid Roles (User + Client Access)
-- Goals: 
-- 1. Allow 'user' role to Create projects even if they have a client_id
-- 2. Allow users to View/Update their OWN projects (created_by = auth.uid()) permissions
-- 3. Maintain Client isolation (can only see assigned client projects)

-- 1. Helper to check if user is strict Staff (Admin or User WITHOUT client link)
CREATE OR REPLACE FUNCTION is_internal_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR (role = 'user' AND client_id IS NULL))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update Projects SELECT Policy
DROP POLICY IF EXISTS "View projects based on contact" ON projects;
CREATE POLICY "View projects (Hybrid)" ON projects
FOR SELECT TO authenticated
USING (
  -- Case 1: Internal Staff see ALL (or you might restrict this, but keeping consistent with "view all" for staff)
  is_internal_staff()
  OR
  -- Case 2: Creator of the project (Personal projects)
  created_by = auth.uid()
  OR
  -- Case 3: Client Match (Project belongs to user's linked client)
  (client_id IS NOT NULL AND client_id = get_auth_user_client_id())
);

-- 3. Update Projects INSERT Policy
DROP POLICY IF EXISTS "Create projects based on role" ON projects;
CREATE POLICY "Create projects (Hybrid)" ON projects
FOR INSERT TO authenticated
WITH CHECK (
  -- Allow Admin and User roles to create. Guests cannot.
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'user') -- Hybrid users are 'user' role
  )
);

-- 4. Update Projects UPDATE Policy
DROP POLICY IF EXISTS "Update projects based on role" ON projects;
CREATE POLICY "Update projects (Hybrid)" ON projects
FOR UPDATE TO authenticated
USING (
  -- Internal Staff (Admin/Unlinked User)
  is_internal_staff()
  OR
  -- Creator (Personal projects)
  created_by = auth.uid()
  -- Note: We generally DO NOT allow clients to edit the Client Projects themselves, only view.
  -- If Hybrid user created it, they fall into 'created_by' clause.
);

-- 5. Update Projects DELETE Policy
-- (Assuming we had one or need one)
DROP POLICY IF EXISTS "Users can delete own projects or admins can delete any" ON projects;
CREATE POLICY "Delete projects (Hybrid)" ON projects
FOR DELETE TO authenticated
USING (
  -- Internal Staff
  is_internal_staff()
  OR
  -- Creator
  created_by = auth.uid()
);
