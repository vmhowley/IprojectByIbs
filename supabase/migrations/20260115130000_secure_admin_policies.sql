-- ==============================================================================
-- SECURE ADMIN POLICIES (TENANT ISOLATION)
-- ==============================================================================
-- Goal: Restrict 'admin' role to only access data within their Organization (Domain).
-- Global access is reserved for 'support_agent' (via is_support_staff function).

-- 1. Helper: Check if user is a "Tenant Admin"
-- Meaning: Valid role 'admin' AND having a private domain (e.g. @company.com)
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND NOT is_public_domain(get_email_domain(email))
  );
$$;

-- ==============================================================================
-- PROJECTS POLICIES
-- ==============================================================================

-- Drop simplistic/insecure policies
DROP POLICY IF EXISTS "View projects based on contact and domain" ON projects;
DROP POLICY IF EXISTS "Users can update own projects or admins can update any" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects or admins can delete any" ON projects;

-- 1. SELECT (View)
CREATE POLICY "Secure view projects" ON projects
FOR SELECT TO authenticated
USING (
  -- A. Super Permission: Support Agent
  public.is_support_staff()
  OR
  -- B. Tenant Admin (View EVERYTHING in their domain)
  (
    public.is_tenant_admin()
    AND
    public.get_user_domain_by_id(projects.created_by) = public.get_my_email_domain()
  )
  OR
  -- C. Standard Ownership / Membership
  (
    projects.created_by = auth.uid()
    OR
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid())
    OR
    projects.client_id = public.get_auth_user_client_id()
  )
  OR
  -- D. Colleague Visibility (Non-Admin Team Members)
  -- Allows standard users to see projects from teammates in private domains
  (
    NOT public.is_public_domain(public.get_my_email_domain())
    AND
    public.get_user_domain_by_id(projects.created_by) = public.get_my_email_domain()
  )
);

-- 2. UPDATE
CREATE POLICY "Secure update projects" ON projects
FOR UPDATE TO authenticated
USING (
  -- A. Support Agent
  public.is_support_staff()
  OR
  -- B. Tenant Admin (Edit EVERYTHING in their domain)
  (
    public.is_tenant_admin()
    AND
    public.get_user_domain_by_id(projects.created_by) = public.get_my_email_domain()
  )
  OR
  -- C. Owner
  (projects.created_by = auth.uid())
);

-- 3. DELETE
CREATE POLICY "Secure delete projects" ON projects
FOR DELETE TO authenticated
USING (
  -- A. Support Agent
  public.is_support_staff()
  OR
  -- B. Tenant Admin (Delete EVERYTHING in their domain)
  (
    public.is_tenant_admin()
    AND
    public.get_user_domain_by_id(projects.created_by) = public.get_my_email_domain()
  )
  OR
  -- C. Owner
  (projects.created_by = auth.uid())
);

-- ==============================================================================
-- TICKETS POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "View tickets based on contact and domain" ON tickets;
DROP POLICY IF EXISTS "Users can update own tickets or admins can update any" ON tickets;
DROP POLICY IF EXISTS "Users can delete own tickets or admins can delete any" ON tickets;

-- 1. SELECT
CREATE POLICY "Secure view tickets" ON tickets
FOR SELECT TO authenticated
USING (
  public.is_support_staff()
  OR
  (
    public.is_tenant_admin()
    AND
    public.get_user_domain_by_id(tickets.created_by) = public.get_my_email_domain()
  )
  OR
  (
    tickets.created_by = auth.uid()
    OR
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = tickets.project_id AND pm.user_id = auth.uid())
    OR
    tickets.client_id = public.get_auth_user_client_id()
  )
  OR
  (
    NOT public.is_public_domain(public.get_my_email_domain())
    AND
    public.get_user_domain_by_id(tickets.created_by) = public.get_my_email_domain()
  )
);

-- 2. UPDATE / DELETE (Simplifying to ownership logic for Tickets to align with Projects)
CREATE POLICY "Secure update tickets" ON tickets
FOR UPDATE TO authenticated
USING (
  public.is_support_staff()
  OR
  (
    public.is_tenant_admin()
    AND
    public.get_user_domain_by_id(tickets.created_by) = public.get_my_email_domain()
  )
  OR
  tickets.created_by = auth.uid()
);

CREATE POLICY "Secure delete tickets" ON tickets
FOR DELETE TO authenticated
USING (
  public.is_support_staff()
  OR
  (
    public.is_tenant_admin()
    AND
    public.get_user_domain_by_id(tickets.created_by) = public.get_my_email_domain()
  )
  OR
  tickets.created_by = auth.uid()
);
