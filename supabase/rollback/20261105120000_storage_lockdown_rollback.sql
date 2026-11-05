-- ==============================================================================
-- ROLLBACK OF 20261105120000_storage_lockdown.sql
-- Removes the project-file policies and puts back the four policies saved in
-- backup.storage_policies_20261105120000. This reopens storage to anyone with
-- the anon key: use it only if uploads break, while the cause is fixed.
-- The helper functions stay; they are harmless.
-- Not a migration: run it by hand in the SQL editor.
-- ==============================================================================

DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('backup.storage_policies_20261105120000') IS NULL THEN
    RAISE EXCEPTION 'backup.storage_policies_20261105120000 not found; nothing to restore';
  END IF;

  DROP POLICY IF EXISTS "Read project files" ON storage.objects;
  DROP POLICY IF EXISTS "Add project files" ON storage.objects;
  DROP POLICY IF EXISTS "Replace project files" ON storage.objects;
  DROP POLICY IF EXISTS "Delete project files" ON storage.objects;

  FOR pol IN SELECT * FROM backup.storage_policies_20261105120000 LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects AS %s FOR %s TO %s%s%s',
      pol.policyname,
      pol.permissive,
      pol.cmd,
      (SELECT string_agg(quote_ident(r), ', ') FROM unnest(pol.roles) AS r),
      CASE WHEN pol.qual IS NOT NULL THEN ' USING (' || pol.qual || ')' ELSE '' END,
      CASE WHEN pol.with_check IS NOT NULL THEN ' WITH CHECK (' || pol.with_check || ')' ELSE '' END
    );
  END LOOP;
END $$;
