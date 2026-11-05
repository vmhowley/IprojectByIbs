-- ==============================================================================
-- ROLLBACK OF 20261105122000_client_portal_users.sql
-- Puts back ticket_row_visible as 20261103122000_tenant_isolation.sql defined
-- it, so staff see every ticket of any project they can see again.
-- is_staff() stays as the hotfix defined it, which is what the migration sets.
-- Not a migration: run it by hand in the SQL editor.
-- ==============================================================================

-- Staff see every ticket of a project they can see. Guests only see tickets
-- tagged with their client, so internal tickets stay internal. A colleague's
-- ticket inside another company's project belongs to that project.
CREATE OR REPLACE FUNCTION public.ticket_row_visible(
  p_created_by uuid, p_assigned_to text, p_client_id uuid, p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR coalesce(p_created_by = auth.uid(), false)
    OR coalesce(p_assigned_to = auth.uid()::text, false)
    OR coalesce(p_client_id = public.get_auth_user_client_id(), false)
    OR public.client_domain_has_access(p_client_id)
    OR public.is_project_member(p_project_id)
    OR (p_project_id IS NULL AND public.is_colleague(p_created_by))
    OR (public.is_staff() AND public.can_view_project(p_project_id));
$$;
