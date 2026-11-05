-- ==============================================================================
-- SECURITY HOTFIX
-- The production policies diverged from this migration history, so this file
-- only adds guards that do not depend on which policies exist:
-- 1. The anon role loses every table policy. Its key ships in the frontend
--    bundle, and no public page reads or writes table data.
-- 2. Domain helpers read the confirmed email from auth.users instead of the
--    user-editable user_profiles.email, so a user cannot claim another
--    company's domain.
-- 3. Profile columns are guarded: nobody changes their own role, client link,
--    email or plan; only support staff grant the support role; editors outside
--    a user's domain only change that user's client link.
-- The policy rework itself comes in 20261103122000_tenant_isolation.sql.
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- 0. BACKUP
-- The policies and functions this migration changes are saved first, so they
-- can be put back by hand. The backup schema is not exposed through the API.
-- A re-run keeps the first backup.
-- ------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.policies_20261103120000 AS
SELECT now() AS saved_at, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND roles && ARRAY['anon', 'public']::name[];
CREATE TABLE IF NOT EXISTS backup.functions_20261103120000 AS
SELECT now() AS saved_at, p.oid::regprocedure::text AS signature, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.prokind = 'f'
  AND p.proname IN (
    'can_manage_client', 'can_manage_contact', 'client_owner_manageable',
    'get_my_email_domain', 'get_user_domain_by_id', 'is_colleague', 'is_staff',
    'is_support_staff', 'is_tenant_admin', 'my_private_domain',
    'protect_user_profile_columns'
  );


-- ------------------------------------------------------------------------------
-- 1. ANON LOCKDOWN
-- Policies granted only to anon are dropped. Policies granted to PUBLIC (which
-- includes anon) are narrowed to authenticated, so signed-in users keep the
-- access they have today.
-- ------------------------------------------------------------------------------

DO $$
DECLARE
  pol record;
  new_roles text[];
BEGIN
  FOR pol IN
    SELECT tablename, policyname, roles::text[] AS roles
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles && ARRAY['anon', 'public']::name[]
  LOOP
    new_roles := ARRAY(
      SELECT DISTINCT r
      FROM unnest(
        array_remove(array_remove(pol.roles, 'anon'), 'public')
        || CASE WHEN 'public' = ANY (pol.roles) THEN ARRAY['authenticated'] ELSE ARRAY[]::text[] END
      ) AS r
    );

    IF cardinality(new_roles) = 0 THEN
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
    ELSE
      EXECUTE format('ALTER POLICY %I ON public.%I TO %s', pol.policyname, pol.tablename,
        (SELECT string_agg(quote_ident(r), ', ') FROM unnest(new_roles) AS r));
    END IF;
  END LOOP;
END $$;

-- RLS was disabled here, so policies did not apply and the anon key could edit
-- the list. Signed-in users keep their current access until the policy rework.
ALTER TABLE public.ticket_request_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in users manage request types" ON public.ticket_request_types;
CREATE POLICY "Signed-in users manage request types" ON public.ticket_request_types
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 2. HELPERS
-- Boolean helpers never return NULL, so NOT helper() is safe in triggers.
-- ------------------------------------------------------------------------------

-- Unconfirmed emails return NULL, so an unverified signup gets no domain access.
CREATE OR REPLACE FUNCTION public.get_my_email_domain()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.get_email_domain(u.email)
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_user_domain_by_id(user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.get_email_domain(u.email)
  FROM auth.users u
  WHERE u.id = get_user_domain_by_id.user_id
    AND u.email_confirmed_at IS NOT NULL;
$$;

-- The caller's domain, or NULL for public providers (gmail.com, ...), whose
-- users are never colleagues of each other.
CREATE OR REPLACE FUNCTION public.my_private_domain()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d
  FROM (SELECT public.get_my_email_domain() AS d) x
  WHERE d IS NOT NULL
    AND NOT public.is_public_domain(d);
$$;

CREATE OR REPLACE FUNCTION public.is_colleague(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.get_user_domain_by_id(p_user_id) = public.my_private_domain(), false);
$$;

CREATE OR REPLACE FUNCTION public.is_support_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'support_agent'
  );
$$;

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

-- Admins on public domains manage nobody but themselves.
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.my_private_domain() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Clients belong to the domain of the user who created them.
CREATE OR REPLACE FUNCTION public.client_owner_manageable(p_owner uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR (
      public.is_staff()
      AND (coalesce(p_owner = auth.uid(), false) OR public.is_colleague(p_owner))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id
      AND public.client_owner_manageable(c.user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_contact(p_contact_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = p_contact_id
      AND public.can_manage_client(c.client_id)
  );
$$;


-- ------------------------------------------------------------------------------
-- 3. PROTECTED PROFILE COLUMNS
-- "Users can update own profile" does not restrict columns, so any user could
-- make themselves admin or switch their plan to pro, and the admin policies
-- let any admin rewrite any user. Requests without a user JWT (service role:
-- Stripe webhook, SQL editor) are not restricted.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
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

  -- Admins manage users of their own domain; anyone else only changes the
  -- client link (client portal invitations).
  IF NOT (public.is_tenant_admin() AND public.is_colleague(NEW.id))
     AND (to_jsonb(NEW) - 'client_id' - 'contact_id' - 'updated_at')
         IS DISTINCT FROM (to_jsonb(OLD) - 'client_id' - 'contact_id' - 'updated_at') THEN
    RAISE EXCEPTION 'only the client link of users outside your domain can be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_profile_columns ON public.user_profiles;
CREATE TRIGGER protect_user_profile_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_columns();
