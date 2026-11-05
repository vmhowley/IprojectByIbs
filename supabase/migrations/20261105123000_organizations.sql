-- ==============================================================================
-- ORGANIZATIONS
-- ibPulse grouped people by email domain: whoever shared a private domain was
-- a colleague, and an account on gmail.com or another public provider always
-- worked alone. A company on a public provider could not have a team, and an
-- admin could not add anyone from another domain. Each account now belongs to
-- one organization, and the helpers every policy is built on compare
-- organizations instead of domains, so the policies stay as they are:
-- * Existing accounts: each private domain becomes one organization that keeps
--   the domain, and each other account gets its own organization. An
--   organization without an admin gets one: its oldest 'user'.
-- * New accounts join the organization that invited their email, or the one
--   that claimed their email domain; otherwise they get a new organization,
--   named after the company typed at signup, and are its admin. Only an admin
--   whose confirmed email is on a domain can claim it.
-- * Admins invite people by email from any domain. An account that works
--   alone accepts the invitation in the app and moves with what it created.
-- * Profiles are visible to the people you work with, not to every account.
-- * The five default request types stay shared and only support staff edit
--   them; each organization adds and edits its own.
-- * Team channels and meetings are shared per organization.
-- Requires 20261105122000_client_portal_users.sql. Rollback:
-- supabase/rollback/20261105123000_organizations_rollback.sql
-- ==============================================================================

DO $$
BEGIN
  IF NOT coalesce((
    SELECT prosrc LIKE '%can_edit_project%'
    FROM pg_proc
    WHERE oid = to_regprocedure('public.ticket_row_visible(uuid, text, uuid, uuid)')
  ), false) THEN
    RAISE EXCEPTION 'Apply 20261105122000_client_portal_users.sql first';
  END IF;

  -- The helpers below are SECURITY DEFINER and must read past RLS.
  IF NOT (SELECT rolbypassrls OR rolsuper FROM pg_roles WHERE rolname = current_user)
     AND EXISTS (
       SELECT 1 FROM pg_tables
       WHERE schemaname = 'public'
         AND tablename IN ('user_profiles', 'channels', 'ticket_request_types', 'meetings')
         AND tableowner <> current_user
     ) THEN
    RAISE EXCEPTION 'Run this migration as the owner of the public tables (postgres)';
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 0. SAVE WHAT THIS MIGRATION REPLACES
-- The rollback puts these back. The backup schema is not exposed through the
-- API. A re-run keeps the first backup.
-- ------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS backup;
REVOKE ALL ON SCHEMA backup FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS backup.functions_20261105123000 AS
SELECT now() AS saved_at, p.oid::regprocedure::text AS signature, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.prokind = 'f'
  AND p.proname IN (
    'client_domain_has_access', 'handle_new_user', 'is_colleague', 'is_tenant_admin',
    'protect_user_profile_columns'
  );

CREATE TABLE IF NOT EXISTS backup.policies_20261105123000 AS
SELECT now() AS saved_at, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    tablename IN ('channels', 'channel_messages', 'ticket_request_types')
    OR (tablename IN ('user_profiles', 'meetings') AND cmd = 'SELECT')
  );


-- ------------------------------------------------------------------------------
-- 1. SCHEMA
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  -- New accounts on this email domain join the organization.
  email_domain text UNIQUE CHECK (email_domain = lower(btrim(email_domain))),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organizations FROM anon;
GRANT SELECT, UPDATE ON public.organizations TO authenticated;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON public.user_profiles (organization_id);

-- One pending invitation per email and organization. Accepting deletes it.
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(btrim(email)) AND email LIKE '_%@_%'),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
  invited_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON public.organization_invitations (email);
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organization_invitations FROM anon;
GRANT SELECT, INSERT, DELETE ON public.organization_invitations TO authenticated;

-- NULL is a default type every organization uses.
ALTER TABLE public.ticket_request_types
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ticket_request_types_organization_id ON public.ticket_request_types (organization_id);

-- Channels belong to an organization; the domain stays for older rows.
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.channels ALTER COLUMN domain DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_channels_organization_id ON public.channels (organization_id);


-- ------------------------------------------------------------------------------
-- 2. HELPERS
-- An account belongs to its organization once its email is confirmed, as it
-- had no domain before. Boolean helpers never return NULL.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.org_of(p_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT p.organization_id
  FROM public.user_profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = p_user_id
    AND u.email_confirmed_at IS NOT NULL;
$$;
-- Only the helpers below call it.
REVOKE EXECUTE ON FUNCTION public.org_of(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.my_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.org_of(auth.uid());
$$;

-- Same organization as the caller.
CREATE OR REPLACE FUNCTION public.is_colleague(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.org_of(p_user_id) = public.my_org_id(), false);
$$;

-- Admins manage the people and the settings of their own organization.
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.my_org_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- A colleague of the caller is linked to the client, so the client company's
-- team shares that client's projects and tickets.
CREATE OR REPLACE FUNCTION public.client_domain_has_access(p_client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_client_id IS NOT NULL
    AND public.my_org_id() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles colleague
      LEFT JOIN public.contacts c ON c.id = colleague.contact_id
      WHERE (colleague.client_id = p_client_id OR c.client_id = p_client_id)
        AND public.is_colleague(colleague.id)
    );
$$;

-- The organization whose portal the caller uses as a client: the one that
-- owns the client the caller is linked to.
CREATE OR REPLACE FUNCTION public.my_vendor_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.org_of(c.user_id)
  FROM public.clients c
  WHERE c.id = public.get_auth_user_client_id();
$$;

-- New rows land in the caller's organization.
ALTER TABLE public.organization_invitations ALTER COLUMN organization_id SET DEFAULT public.my_org_id();
ALTER TABLE public.ticket_request_types ALTER COLUMN organization_id SET DEFAULT public.my_org_id();
ALTER TABLE public.channels ALTER COLUMN organization_id SET DEFAULT public.my_org_id();


-- ------------------------------------------------------------------------------
-- 3. EXISTING ACCOUNTS AND DATA
-- Only rows without an organization change, so a re-run does nothing.
-- ------------------------------------------------------------------------------

-- Each private domain of confirmed accounts, named after the domain until an
-- admin renames it.
INSERT INTO public.organizations (name, email_domain, created_by)
SELECT d.domain, d.domain, d.first_admin
FROM (
  SELECT public.get_email_domain(u.email) AS domain,
         (array_agg(u.id ORDER BY (p.role = 'admin') DESC, u.created_at))[1] AS first_admin
  FROM auth.users u
  JOIN public.user_profiles p ON p.id = u.id
  WHERE p.organization_id IS NULL
    AND u.email_confirmed_at IS NOT NULL
    AND public.get_email_domain(u.email) <> ''
    AND NOT public.is_public_domain(public.get_email_domain(u.email))
  GROUP BY 1
) d
ON CONFLICT (email_domain) DO NOTHING;

UPDATE public.user_profiles p
SET organization_id = o.id
FROM auth.users u, public.organizations o
WHERE u.id = p.id
  AND p.organization_id IS NULL
  AND u.email_confirmed_at IS NOT NULL
  AND o.email_domain = public.get_email_domain(u.email);

-- Every other account works alone, in an organization of its own.
DO $$
DECLARE
  r record;
  v_org uuid;
BEGIN
  FOR r IN
    SELECT p.id, p.name, u.id AS auth_id
    FROM public.user_profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.organization_id IS NULL
  LOOP
    INSERT INTO public.organizations (name, created_by)
    VALUES (left(coalesce(nullif(btrim(r.name), ''), 'Mi equipo'), 120), r.auth_id)
    RETURNING id INTO v_org;

    UPDATE public.user_profiles SET organization_id = v_org WHERE id = r.id;
  END LOOP;
END $$;

-- Only admins invite people, so an organization without one gets one: its
-- oldest account with the role 'user'. The rollback demotes them.
CREATE TABLE IF NOT EXISTS backup.promoted_admins_20261105123000 (id uuid PRIMARY KEY);

WITH chosen AS (
  SELECT DISTINCT ON (p.organization_id) p.id
  FROM public.user_profiles p
  WHERE p.role = 'user'
    AND p.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.user_profiles a
      WHERE a.organization_id = p.organization_id AND a.role = 'admin'
    )
  ORDER BY p.organization_id, p.created_at, p.id
), saved AS (
  INSERT INTO backup.promoted_admins_20261105123000 (id)
  SELECT id FROM chosen
  ON CONFLICT DO NOTHING
)
UPDATE public.user_profiles p
SET role = 'admin'
FROM chosen c
WHERE p.id = c.id;

-- The five defaults stay shared. The types added since then are the ones of
-- the only company that has used ibPulse so far.
UPDATE public.ticket_request_types t
SET organization_id = o.id
FROM public.organizations o
WHERE o.email_domain = 'ibsystems.com.do'
  AND t.organization_id IS NULL
  AND t.value NOT IN ('feature', 'bug', 'enhancement', 'consult', 'other');

UPDATE public.channels c
SET organization_id = o.id
FROM public.organizations o
WHERE c.organization_id IS NULL
  AND o.email_domain = c.domain;


-- ------------------------------------------------------------------------------
-- 4. SIGNUP AND PROFILE GUARD
-- ------------------------------------------------------------------------------

-- An invitation decides the organization and the role. Without one, a private
-- domain claimed by an organization joins it as 'user'. Otherwise the account
-- gets a new organization, named after the company typed at signup or after
-- the person, and is its admin. An account that is not confirmed yet gets no
-- access from any of this until it confirms.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  v_company text := left(nullif(btrim(new.raw_user_meta_data->>'company'), ''), 120);
  v_domain text := public.get_email_domain(new.email);
  v_invitation uuid;
  v_org uuid;
  v_role text;
BEGIN
  SELECT i.id, i.organization_id, i.role
  INTO v_invitation, v_org, v_role
  FROM public.organization_invitations i
  WHERE i.email = lower(new.email)
  ORDER BY i.created_at DESC
  LIMIT 1;

  IF v_org IS NULL AND v_domain <> '' AND NOT public.is_public_domain(v_domain) THEN
    SELECT o.id INTO v_org FROM public.organizations o WHERE o.email_domain = v_domain;
    v_role := 'user';
  END IF;

  IF v_org IS NULL THEN
    INSERT INTO public.organizations (name, created_by)
    VALUES (left(coalesce(v_company, nullif(btrim(v_name), ''), 'Mi equipo'), 120), new.id)
    RETURNING id INTO v_org;
    v_role := 'admin';
  END IF;

  INSERT INTO public.user_profiles (id, name, email, role, organization_id)
  VALUES (new.id, v_name, new.email, v_role, v_org);

  IF v_invitation IS NOT NULL THEN
    DELETE FROM public.organization_invitations WHERE id = v_invitation;
  END IF;

  RETURN new;
END;
$$;

-- As in 20261103120000_security_hotfix.sql, plus the organization: it decides
-- who your colleagues are, so it changes only when accept_invitation() moves
-- the caller, or by support staff.
CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- accept_invitation() moves the caller into the inviting organization with
  -- the invited role; it changes nothing else.
  IF current_setting('ibpulse.accepting_invitation', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Billing is written only by the backend after a verified payment.
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    RAISE EXCEPTION 'subscription fields can only be changed by the billing backend';
  END IF;

  -- Domain-based access depends on the email, so it mirrors auth.users only.
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'email cannot be changed from the client';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     AND NOT public.is_support_staff() THEN
    RAISE EXCEPTION 'the organization of an account changes only by accepting an invitation';
  END IF;

  -- support_agent has global access, so only support staff grant or revoke it.
  IF NEW.role IS DISTINCT FROM OLD.role
     AND 'support_agent' IN (NEW.role, OLD.role)
     AND NOT public.is_support_staff() THEN
    RAISE EXCEPTION 'only support staff can grant or revoke the support role';
  END IF;

  IF NEW.id = auth.uid() THEN
    -- Nobody except support staff changes their own role or client link.
    IF NOT public.is_support_staff()
       AND (NEW.role IS DISTINCT FROM OLD.role
            OR NEW.client_id IS DISTINCT FROM OLD.client_id
            OR NEW.contact_id IS DISTINCT FROM OLD.contact_id) THEN
      RAISE EXCEPTION 'you cannot change your own role or client link';
    END IF;
    RETURN NEW;
  END IF;

  IF public.is_support_staff() THEN
    RETURN NEW;
  END IF;

  -- A client link grants that client's projects and tickets, so it can only
  -- point to a client the editor manages.
  IF NEW.client_id IS DISTINCT FROM OLD.client_id
     AND NEW.client_id IS NOT NULL
     AND NOT public.can_manage_client(NEW.client_id) THEN
    RAISE EXCEPTION 'you can only link users to clients you manage';
  END IF;
  IF NEW.contact_id IS DISTINCT FROM OLD.contact_id
     AND NEW.contact_id IS NOT NULL
     AND NOT public.can_manage_contact(NEW.contact_id) THEN
    RAISE EXCEPTION 'you can only link users to contacts you manage';
  END IF;

  -- Admins manage users of their own organization; anyone else only changes
  -- the client link (client portal invitations).
  IF NOT (public.is_tenant_admin() AND public.is_colleague(NEW.id))
     AND (to_jsonb(NEW) - 'client_id' - 'contact_id' - 'updated_at')
         IS DISTINCT FROM (to_jsonb(OLD) - 'client_id' - 'contact_id' - 'updated_at') THEN
    RAISE EXCEPTION 'only the client link of users outside your domain can be changed';
  END IF;

  RETURN NEW;
END;
$$;

-- An admin renames the organization or claims the domain of their own
-- confirmed email; public providers are never claimed.
CREATE OR REPLACE FUNCTION public.guard_organization_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_support_staff() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'only the name and the email domain of an organization can change';
  END IF;

  IF NEW.email_domain IS DISTINCT FROM OLD.email_domain
     AND NEW.email_domain IS NOT NULL
     AND NEW.email_domain IS DISTINCT FROM public.my_private_domain() THEN
    RAISE EXCEPTION 'you can only claim the domain of your own email';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_organization_change ON public.organizations;
CREATE TRIGGER guard_organization_change
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.guard_organization_change();


-- ------------------------------------------------------------------------------
-- 5. FUNCTIONS THE APP CALLS
-- ------------------------------------------------------------------------------

-- Invitations waiting for the caller's confirmed email. can_accept is false
-- while the caller's organization has other people (see accept_invitation).
CREATE OR REPLACE FUNCTION public.my_invitations()
RETURNS TABLE (
  id uuid, organization_name text, role text, invited_by_name text,
  created_at timestamptz, can_accept boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT i.id, o.name, i.role, inviter.name, i.created_at,
         NOT EXISTS (
           SELECT 1 FROM public.user_profiles other
           WHERE other.organization_id = me.organization_id AND other.id <> me.id
         )
  FROM auth.users u
  JOIN public.user_profiles me ON me.id = u.id
  JOIN public.organization_invitations i ON i.email = lower(u.email)
  JOIN public.organizations o ON o.id = i.organization_id
  LEFT JOIN public.user_profiles inviter ON inviter.id = i.invited_by
  WHERE u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL
    AND i.organization_id IS DISTINCT FROM me.organization_id
  ORDER BY i.created_at DESC;
$$;

-- Moves the caller into the organization that invited them, with the invited
-- role. Visibility follows whoever created each project and client, so they
-- move with the caller: only an account that works alone can move, or the
-- people it leaves behind would lose that work. The empty organization it
-- leaves hands over its request types, inactive so the picker does not repeat
-- them, and its channels.
CREATE OR REPLACE FUNCTION public.accept_invitation(p_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_invitation public.organization_invitations;
  v_old uuid;
BEGIN
  SELECT i.* INTO v_invitation
  FROM public.organization_invitations i
  JOIN auth.users u ON u.id = auth.uid()
  WHERE i.id = p_invitation_id
    AND u.email_confirmed_at IS NOT NULL
    AND i.email = lower(u.email);
  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'invitation not found';
  END IF;

  SELECT organization_id INTO v_old FROM public.user_profiles WHERE id = auth.uid();
  IF v_old IS NOT DISTINCT FROM v_invitation.organization_id THEN
    DELETE FROM public.organization_invitations WHERE id = v_invitation.id;
    RETURN v_invitation.organization_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE organization_id = v_old AND id <> auth.uid()
  ) THEN
    RAISE EXCEPTION 'your organization has other members';
  END IF;

  PERFORM set_config('ibpulse.accepting_invitation', 'on', true);
  UPDATE public.user_profiles
  SET organization_id = v_invitation.organization_id, role = v_invitation.role
  WHERE id = auth.uid();
  PERFORM set_config('ibpulse.accepting_invitation', 'off', true);

  DELETE FROM public.organization_invitations WHERE id = v_invitation.id;

  IF v_old IS NOT NULL THEN
    UPDATE public.ticket_request_types
    SET organization_id = v_invitation.organization_id, is_active = false
    WHERE organization_id = v_old;
    UPDATE public.channels
    SET organization_id = v_invitation.organization_id
    WHERE organization_id = v_old;
    DELETE FROM public.organizations WHERE id = v_old;
  END IF;

  RETURN v_invitation.organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public, auth
AS $$
  DELETE FROM public.organization_invitations i
  USING auth.users u
  WHERE i.id = p_invitation_id
    AND u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL
    AND i.email = lower(u.email);
$$;

-- Profiles are private, so sharing a project finds an account only by its
-- full email.
CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email text)
RETURNS TABLE (id uuid, name text, email text, avatar text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.email, p.avatar
  FROM public.user_profiles p
  WHERE (public.is_staff() OR public.is_support_staff())
    AND lower(p.email) = lower(btrim(p_email))
  LIMIT 1;
$$;

-- Clientes > Acceso al portal: links the account with this email to a client
-- the caller manages. The account keeps its role and its organization.
-- Returns NULL when no account has the email.
CREATE OR REPLACE FUNCTION public.link_client_user(p_email text, p_client_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.user_profiles;
BEGIN
  IF NOT public.can_manage_client(p_client_id) THEN
    RAISE EXCEPTION 'you can only link users to clients you manage';
  END IF;

  SELECT * INTO v_user
  FROM public.user_profiles
  WHERE lower(email) = lower(btrim(p_email))
  LIMIT 1;
  IF v_user.id IS NULL THEN
    RETURN NULL;
  END IF;
  IF v_user.id = auth.uid() THEN
    RAISE EXCEPTION 'you cannot change your own role or client link';
  END IF;
  IF v_user.client_id IS NOT NULL
     AND v_user.client_id <> p_client_id
     AND NOT public.can_manage_client(v_user.client_id) THEN
    RAISE EXCEPTION 'this account already uses the portal of another company';
  END IF;

  -- protect_user_profile_columns still checks the change as the caller's.
  UPDATE public.user_profiles SET client_id = p_client_id WHERE id = v_user.id;
  RETURN v_user.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.my_invitations() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decline_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.find_user_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_client_user(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_client_user(text, uuid) TO authenticated;


-- ------------------------------------------------------------------------------
-- 6. POLICIES
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  pol record;
BEGIN
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
END $$;

-- ORGANIZATIONS -------------------------------------------------------------------

CREATE POLICY "Members view their organization" ON public.organizations
FOR SELECT TO authenticated
USING (id = public.my_org_id() OR public.is_support_staff());

-- guard_organization_change limits what changes.
CREATE POLICY "Admins edit their organization" ON public.organizations
FOR UPDATE TO authenticated
USING ((id = public.my_org_id() AND public.is_tenant_admin()) OR public.is_support_staff())
WITH CHECK ((id = public.my_org_id() AND public.is_tenant_admin()) OR public.is_support_staff());

CREATE POLICY "Admins view their invitations" ON public.organization_invitations
FOR SELECT TO authenticated
USING (organization_id = public.my_org_id() AND public.is_tenant_admin());

CREATE POLICY "Admins invite people" ON public.organization_invitations
FOR INSERT TO authenticated
WITH CHECK (
  organization_id = public.my_org_id()
  AND public.is_tenant_admin()
  AND invited_by = auth.uid()
);

CREATE POLICY "Admins revoke invitations" ON public.organization_invitations
FOR DELETE TO authenticated
USING (organization_id = public.my_org_id() AND public.is_tenant_admin());

-- USER PROFILES -------------------------------------------------------------------

-- Every signed-in account could read every profile. Now: yourself, the people
-- you share an organization, a project or a ticket with, and the accounts
-- that use the portal of a client you manage.
CREATE POLICY "View profiles of people you work with" ON public.user_profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.shares_work_with(id)
  OR (client_id IS NOT NULL AND public.can_manage_client(client_id))
  OR (contact_id IS NOT NULL AND public.can_manage_contact(contact_id))
);

-- REQUEST TYPES -------------------------------------------------------------------

-- Clients read the labels of the organization whose portal they use.
CREATE POLICY "Read request types" ON public.ticket_request_types
FOR SELECT TO authenticated
USING (
  organization_id IS NULL
  OR organization_id = (SELECT public.my_org_id())
  OR organization_id = (SELECT public.my_vendor_org_id())
  OR (SELECT public.is_support_staff())
);

CREATE POLICY "Admins manage their request types" ON public.ticket_request_types
FOR ALL TO authenticated
USING (
  (SELECT public.is_support_staff())
  OR (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()))
)
WITH CHECK (
  (SELECT public.is_support_staff())
  OR (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()))
);

-- TEAM CHANNELS (one space per organization) --------------------------------------

CREATE POLICY "View team channels" ON public.channels
FOR SELECT TO authenticated
USING (organization_id = public.my_org_id());

CREATE POLICY "Create team channels" ON public.channels
FOR INSERT TO authenticated
WITH CHECK (organization_id = public.my_org_id() AND created_by = auth.uid());

CREATE POLICY "View channel messages" ON public.channel_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_messages.channel_id
      AND c.organization_id = public.my_org_id()
  )
);

CREATE POLICY "Send channel messages" ON public.channel_messages
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_messages.channel_id
      AND c.organization_id = public.my_org_id()
  )
);

-- MEETINGS (writing stays with the owner) ------------------------------------------

CREATE POLICY "View team meetings" ON public.meetings
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_colleague(user_id));

NOTIFY pgrst, 'reload schema';
