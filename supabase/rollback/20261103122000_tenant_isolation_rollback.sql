-- ==============================================================================
-- ROLLBACK OF 20261103122000_tenant_isolation.sql
-- Restores the policies saved in backup.policies_20261103122000 and removes the
-- column guards on tickets and projects. This reopens the access holes the
-- migration closed: use it only if the app breaks, while the cause is fixed.
-- Functions the migration replaced get their saved bodies back. The helpers it
-- added, comments.user_id and the indexes stay; they are harmless.
-- Not a migration: run it by hand in the SQL editor.
-- ==============================================================================

DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('backup.policies_20261103122000') IS NULL THEN
    RAISE EXCEPTION 'backup.policies_20261103122000 not found; nothing to restore';
  END IF;

  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        tablename IN (
          'projects', 'tickets', 'comments', 'clients', 'contacts',
          'project_members', 'project_documents', 'project_activity_logs',
          'ticket_programs', 'ticket_subtasks', 'ticket_request_types',
          'channels', 'channel_messages', 'notifications', 'messages'
        )
        OR (tablename = 'user_profiles'
            AND policyname IN ('Tenant admins update their domain',
                               'Support staff update any profile',
                               'Staff link users to their clients'))
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;

  FOR pol IN SELECT * FROM backup.policies_20261103122000 LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      pol.policyname, pol.tablename, pol.permissive, pol.cmd,
      (SELECT string_agg(CASE WHEN r = 'public' THEN 'PUBLIC' ELSE quote_ident(r) END, ', ')
       FROM unnest(pol.roles::text[]) AS r),
      CASE WHEN pol.qual IS NOT NULL THEN ' USING (' || pol.qual || ')' ELSE '' END,
      CASE WHEN pol.with_check IS NOT NULL THEN ' WITH CHECK (' || pol.with_check || ')' ELSE '' END
    );
  END LOOP;
END $$;

DO $$
DECLARE
  fn record;
BEGIN
  IF to_regclass('backup.functions_20261103122000') IS NOT NULL THEN
    FOR fn IN SELECT definition FROM backup.functions_20261103122000 LOOP
      EXECUTE fn.definition;
    END LOOP;
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_comment_author ON public.comments;
DROP TRIGGER IF EXISTS guard_ticket_change ON public.tickets;
DROP TRIGGER IF EXISTS guard_project_change ON public.projects;
