-- ==============================================================================
-- STORAGE LOCKDOWN
-- Four storage policies created from the dashboard ("Public can view / upload /
-- update / delete ticket attachments m6jz3j_0") are granted to the public role
-- with no condition and no bucket filter. With the anon key, which ships in the
-- frontend, anyone can list, download, overwrite and delete every file in every
-- bucket, meeting recordings included. This migration saves and drops them and
-- lets each file in ticket-attachments follow the project it belongs to, read
-- from its path:
-- * <project id>/<ticket id>/<file>      ticket attachments
-- * projects/<project id>/<file>         project files
-- * documentation/<project id>/<file>    project documentation
-- * documentation/general/<file>         general documentation
-- Whoever sees the project reads and adds files; the uploader and whoever edits
-- the project replace and delete them. General documentation stays inside the
-- uploader's domain. ticket-attachments stays a public bucket, so the links the
-- app has already stored keep working: reading by public link needs no policy.
-- The meeting-recordings policies already check the owner and stay as they are.
-- Requires 20261103122000_tenant_isolation.sql. Rollback:
-- supabase/rollback/20261105120000_storage_lockdown_rollback.sql
-- ==============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.can_view_project(uuid)') IS NULL
     OR to_regprocedure('public.can_edit_project(uuid)') IS NULL
     OR to_regprocedure('public.is_colleague(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Apply 20261103122000_tenant_isolation.sql first';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 0. SAVE THE POLICIES THIS MIGRATION DROPS
-- The rollback puts them back from here. A re-run keeps the first backup.
-- ------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS backup;
REVOKE ALL ON SCHEMA backup FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS backup.storage_policies_20261105120000 AS
SELECT now() AS saved_at, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'Public can view ticket attachments m6jz3j_0',
    'Public can upload ticket attachments m6jz3j_0',
    'Public can update ticket attachments m6jz3j_0',
    'Public can delete ticket attachments m6jz3j_0'
  );

-- ------------------------------------------------------------------------------
-- 1. HELPERS
-- Boolean helpers never return NULL.
-- ------------------------------------------------------------------------------

-- The project a file belongs to, from its path; NULL for any other path.
CREATE OR REPLACE FUNCTION public.attachment_project_id(p_name text)
RETURNS uuid
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_name ~* '^(projects|documentation)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
      THEN split_part(p_name, '/', 2)::uuid
    WHEN p_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
      THEN split_part(p_name, '/', 1)::uuid
  END;
$$;

-- Seeing the project is enough to read a file; general documentation is shared
-- with the uploader's colleagues.
CREATE OR REPLACE FUNCTION public.can_read_attachment(p_name text, p_owner uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(p_owner = auth.uid(), false)
    OR public.is_support_staff()
    OR CASE
         WHEN public.attachment_project_id(p_name) IS NOT NULL
           THEN public.can_view_project(public.attachment_project_id(p_name))
         ELSE public.is_colleague(p_owner)
       END;
$$;

-- Files go into a project the uploader sees, or into general documentation.
-- The uploader becomes the owner, so the owner is not a reason here.
CREATE OR REPLACE FUNCTION public.can_add_attachment(p_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR CASE
         WHEN public.attachment_project_id(p_name) IS NOT NULL
           THEN public.can_view_project(public.attachment_project_id(p_name))
         ELSE p_name LIKE 'documentation/general/%' AND public.is_staff()
       END;
$$;

-- The uploader and whoever edits the project replace or delete a file; in
-- general documentation, the uploader and the admins of their domain.
CREATE OR REPLACE FUNCTION public.can_change_attachment(p_name text, p_owner uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(p_owner = auth.uid(), false)
    OR public.is_support_staff()
    OR CASE
         WHEN public.attachment_project_id(p_name) IS NOT NULL
           THEN public.can_edit_project(public.attachment_project_id(p_name))
         ELSE public.is_tenant_admin() AND public.is_colleague(p_owner)
       END;
$$;

-- ------------------------------------------------------------------------------
-- 2. POLICIES
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can view ticket attachments m6jz3j_0" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload ticket attachments m6jz3j_0" ON storage.objects;
DROP POLICY IF EXISTS "Public can update ticket attachments m6jz3j_0" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete ticket attachments m6jz3j_0" ON storage.objects;

DROP POLICY IF EXISTS "Read project files" ON storage.objects;
CREATE POLICY "Read project files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'ticket-attachments' AND public.can_read_attachment(name, owner));

DROP POLICY IF EXISTS "Add project files" ON storage.objects;
CREATE POLICY "Add project files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments' AND public.can_add_attachment(name));

DROP POLICY IF EXISTS "Replace project files" ON storage.objects;
CREATE POLICY "Replace project files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'ticket-attachments' AND public.can_change_attachment(name, owner))
WITH CHECK (bucket_id = 'ticket-attachments' AND public.can_add_attachment(name));

DROP POLICY IF EXISTS "Delete project files" ON storage.objects;
CREATE POLICY "Delete project files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'ticket-attachments' AND public.can_change_attachment(name, owner));
