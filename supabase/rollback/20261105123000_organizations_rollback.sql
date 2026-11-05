-- ==============================================================================
-- ROLLBACK OF 20261105123000_organizations.sql
-- Puts back the domain helpers, the signup function, the profile guard and the
-- policies saved in backup.*_20261105123000, and demotes the accounts the
-- migration made admins of their own organization. Colleagues are again the
-- people who share a private email domain.
-- Kept, so nothing is lost: the organizations and invitations tables and the
-- organization_id columns, which nothing reads after the rollback. Request
-- types an organization added become visible to everyone again, as all types
-- were before. Channels created without a domain get their creator's domain.
-- Not a migration: run it by hand in the SQL editor.
-- ==============================================================================

DO $$
DECLARE
  f record;
  pol record;
BEGIN
  IF to_regclass('backup.functions_20261105123000') IS NULL
     OR to_regclass('backup.policies_20261105123000') IS NULL THEN
    RAISE EXCEPTION 'backup tables of 20261105123000 not found; nothing to restore';
  END IF;

  -- Functions, as they were before the migration.
  FOR f IN SELECT definition FROM backup.functions_20261105123000 LOOP
    EXECUTE f.definition;
  END LOOP;

  -- Policies: the migration's go, the saved ones come back.
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        tablename IN ('channels', 'channel_messages', 'ticket_request_types',
                      'organizations', 'organization_invitations')
        OR (tablename IN ('user_profiles', 'meetings') AND cmd = 'SELECT')
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;

  FOR pol IN SELECT * FROM backup.policies_20261105123000 LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      pol.policyname,
      pol.tablename,
      pol.permissive,
      pol.cmd,
      (SELECT string_agg(quote_ident(r), ', ') FROM unnest(pol.roles) AS r),
      CASE WHEN pol.qual IS NOT NULL THEN ' USING (' || pol.qual || ')' ELSE '' END,
      CASE WHEN pol.with_check IS NOT NULL THEN ' WITH CHECK (' || pol.with_check || ')' ELSE '' END
    );
  END LOOP;

  IF to_regclass('backup.promoted_admins_20261105123000') IS NOT NULL THEN
    UPDATE public.user_profiles p
    SET role = 'user'
    FROM backup.promoted_admins_20261105123000 b
    WHERE b.id = p.id AND p.role = 'admin';
  END IF;
END $$;

DROP TRIGGER IF EXISTS guard_organization_change ON public.organizations;

ALTER TABLE public.organization_invitations ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE public.ticket_request_types ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE public.channels ALTER COLUMN organization_id DROP DEFAULT;

UPDATE public.channels c
SET domain = public.get_user_domain_by_id(c.created_by)
WHERE c.domain IS NULL;

DROP FUNCTION IF EXISTS public.link_client_user(text, uuid);
DROP FUNCTION IF EXISTS public.find_user_by_email(text);
DROP FUNCTION IF EXISTS public.decline_invitation(uuid);
DROP FUNCTION IF EXISTS public.accept_invitation(uuid);
DROP FUNCTION IF EXISTS public.my_invitations();
DROP FUNCTION IF EXISTS public.guard_organization_change();
DROP FUNCTION IF EXISTS public.my_vendor_org_id();
DROP FUNCTION IF EXISTS public.my_org_id();
DROP FUNCTION IF EXISTS public.org_of(uuid);

NOTIFY pgrst, 'reload schema';
