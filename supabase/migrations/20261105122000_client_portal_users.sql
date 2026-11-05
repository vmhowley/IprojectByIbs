-- ==============================================================================
-- CLIENT PORTAL USERS ARE CLIENTS
-- Clientes > Acceso al portal links an existing account to a client. Staff
-- cannot change the role of users outside their domain, so the linked account
-- keeps the role 'user', and is_staff() counted it as staff: it saw every
-- ticket of its client's projects, internal ones included, and could create
-- projects, tickets and clients. A 'user' linked to a client or a contact is a
-- guest now: it sees its client's projects and tickets, comments, and answers
-- approvals. Admins keep their role, so the admin of a company that uses ibPulse
-- for its own team stays staff there even when another company links them.
-- Requires 20261103120000_security_hotfix.sql. Rollback:
-- supabase/rollback/20261105122000_client_portal_users_rollback.sql
-- ==============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.is_staff()') IS NULL THEN
    RAISE EXCEPTION 'Apply 20261103120000_security_hotfix.sql first';
  END IF;
END $$;

-- Vendor-side roles. Guests are client contacts, and so is a 'user' linked to a client.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR (role = 'user' AND client_id IS NULL AND contact_id IS NULL)
      )
  );
$$;
