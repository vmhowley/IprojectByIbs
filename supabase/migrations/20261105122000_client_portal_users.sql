-- ==============================================================================
-- CLIENT PORTAL ACCESS IS PER CLIENT, NOT PER ACCOUNT
-- Clientes > Acceso al portal links an existing account to a client. That
-- account keeps its role and its own work: it is a guest only on the projects
-- of the client it is linked to. ticket_row_visible let staff see every ticket
-- of any project they could see, so a linked account with the role 'user' saw
-- the internal tickets of its client's projects too. Staff now see every ticket
-- only of the projects they can edit; a project seen through a client link
-- shows the tickets tagged with that client, as it does for guests.
-- An earlier draft of this file made every linked 'user' a guest everywhere.
-- is_staff() is defined again as the hotfix had it, in case that draft ran.
-- Requires 20261103122000_tenant_isolation.sql. Rollback:
-- supabase/rollback/20261105122000_client_portal_users_rollback.sql
-- ==============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.ticket_row_visible(uuid, text, uuid, uuid)') IS NULL
     OR to_regprocedure('public.can_edit_project(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Apply 20261103122000_tenant_isolation.sql first';
  END IF;
END $$;

-- Vendor-side roles. Guests are client contacts.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'user')
  );
$$;

-- Staff see every ticket of a project they can edit. Guests, and anyone who
-- sees a project only through a client link, see the tickets tagged with
-- their client, so internal tickets stay internal. A colleague's ticket inside
-- another company's project belongs to that project.
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
    OR (public.is_staff() AND public.can_edit_project(p_project_id));
$$;
