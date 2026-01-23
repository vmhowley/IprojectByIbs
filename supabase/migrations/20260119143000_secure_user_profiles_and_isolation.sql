-- ==============================================================================
-- SECURE ROLE MANAGEMENT & ADMIN DOMAIN ISOLATION
-- ==============================================================================

-- 1. Remove insecure direct update policies
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON user_profiles;

-- 2. SECURE UPDATE: Standard Users (Can only update name/avatar of themselves)
-- We use a trigger or a strict check for the role field. 
-- Since RLS WITH CHECK can't easily compare old/new values, 
-- we ensure standard users can only update IF the role field in the WITH CHECK 
-- matches what is already in the database for them (effectively preventing change).

CREATE POLICY "Users can update own profile (no role change)" ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
);

-- 3. SECURE UPDATE: Domain Admins
-- Domain admins can update profiles of people in their SAME domain.
-- They CANNOT change roles of people outside their domain.
-- They ALSO cannot change their own role (to prevent accidental loss of admin).

CREATE POLICY "Admins can update users in their domain" ON user_profiles
FOR UPDATE
TO authenticated
USING (
  public.is_tenant_admin()
  AND public.get_user_domain_by_id(user_profiles.id) = public.get_my_email_domain()
  AND auth.uid() != id -- Admins use the above policy for their own profile (preventing self-promotion/demotion)
)
WITH CHECK (
  public.is_tenant_admin()
  AND public.get_user_domain_by_id(user_profiles.id) = public.get_my_email_domain()
);

-- 4. SECURE UPDATE: Support Staff (Global Access)
CREATE POLICY "Support staff can update any profile" ON user_profiles
FOR UPDATE
TO authenticated
USING (public.is_support_staff())
WITH CHECK (public.is_support_staff());

-- 5. REFINE VIEW: Admins only see users in their domain (Privacy)
-- This replaces the "Users can view all profiles" policy
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;

CREATE POLICY "Restricted profile view" ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- A. Support Staff see everything
  public.is_support_staff()
  OR
  -- B. Colleagues see each other (Private Domains)
  (
    NOT public.is_public_domain(public.get_my_email_domain())
    AND public.get_user_domain_by_id(user_profiles.id) = public.get_my_email_domain()
  )
  OR
  -- C. Collaborators see each other
  EXISTS (
    SELECT 1 FROM project_members pm1
    JOIN projects p ON p.id = pm1.project_id
    LEFT JOIN project_members pm2 ON pm2.project_id = p.id
    WHERE (p.created_by = auth.uid() OR pm1.user_id = auth.uid())
    AND (user_profiles.id = p.created_by OR user_profiles.id = pm2.user_id)
  )
  OR
  -- D. I can always see myself
  auth.uid() = id
);
