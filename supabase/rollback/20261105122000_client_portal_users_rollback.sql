-- ==============================================================================
-- ROLLBACK OF 20261105122000_client_portal_users.sql
-- Puts back is_staff() as 20261103120000_security_hotfix.sql defined it, so a
-- 'user' linked to a client counts as staff again.
-- Not a migration: run it by hand in the SQL editor.
-- ==============================================================================

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
