-- ==============================================================================
-- TENANT ISOLATION
-- Production accumulated permissive policies from several eras. For example,
-- is_internal_staff() is true for every new signup, so "View projects
-- (Hybrid)" and "Manage projects based on role" let anyone who registered read,
-- edit and delete every project. This migration drops every policy on the
-- tables below, whatever its name, and creates one coherent set:
-- * Support staff (support_agent) have global access.
-- * Staff (admin, user) work on what they created, are assigned to or are
--   members of, and on everything created by colleagues who share a private
--   email domain. Public providers (gmail.com, ...) make nobody a colleague.
-- * Creators, admins of the creator's domain and support staff delete and
--   manage members.
-- * Guests (client contacts) see their client's projects and client tickets,
--   comment, and answer approvals.
-- Requires 20261103120000_security_hotfix.sql.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'protect_user_profile_columns') THEN
    RAISE EXCEPTION 'Apply 20261103120000_security_hotfix.sql first';
  END IF;

  -- The helpers below are SECURITY DEFINER and must read past RLS.
  IF NOT (SELECT rolbypassrls OR rolsuper FROM pg_roles WHERE rolname = current_user)
     AND EXISTS (
       SELECT 1 FROM pg_tables
       WHERE schemaname = 'public'
         AND tablename IN ('projects', 'project_members', 'tickets', 'clients', 'contacts', 'user_profiles')
         AND tableowner <> current_user
     ) THEN
    RAISE EXCEPTION 'Run this migration as the owner of the public tables (postgres)';
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 0. SAVE THE FUNCTIONS THIS MIGRATION REPLACES
-- Some helpers below may already exist with other bodies, and policies on
-- tables outside this migration may call them. Their current definitions are
-- saved so the rollback can put them back. A re-run keeps the first backup.
-- ------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.functions_20261103122000 AS
SELECT now() AS saved_at, p.oid::regprocedure::text AS signature, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.prokind = 'f'
  AND p.proname IN (
    'can_edit_project', 'can_edit_ticket', 'can_manage_item', 'can_manage_project',
    'can_view_client', 'can_view_project', 'can_view_ticket', 'client_domain_has_access',
    'client_row_visible', 'get_auth_user_client_id', 'get_auth_user_role',
    'guard_project_change', 'guard_ticket_change', 'is_owner_or_tenant_admin',
    'is_project_member', 'project_row_editable', 'project_row_visible',
    'set_comment_author', 'shares_work_with', 'ticket_row_editable',
    'ticket_row_visible', 'update_ticket_comment_count'
  );


-- ------------------------------------------------------------------------------
-- 1. SCHEMA
-- ------------------------------------------------------------------------------

-- The app already sends comments.user_id, but the column never reached
-- production, so creating comments failed.
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
-- Set apart from ADD COLUMN so existing comments keep a NULL author instead of
-- whoever runs the migration.
ALTER TABLE public.comments ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON public.project_members (project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects (created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON public.tickets (project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets (created_by);
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON public.comments (ticket_id);


-- ------------------------------------------------------------------------------
-- 2. HELPERS
-- Row policies call the *_row_* helpers with the row's own columns: a helper
-- that looked the row up by id would not see a row being inserted, and
-- INSERT ... RETURNING would fail. Boolean helpers never return NULL.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Direct client link first, then the client of the linked contact.
CREATE OR REPLACE FUNCTION public.get_auth_user_client_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(p.client_id, c.client_id)
  FROM public.user_profiles p
  LEFT JOIN public.contacts c ON c.id = p.contact_id
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
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
    AND public.my_private_domain() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles colleague
      LEFT JOIN public.contacts c ON c.id = colleague.contact_id
      WHERE (colleague.client_id = p_client_id OR c.client_id = p_client_id)
        AND public.is_colleague(colleague.id)
    );
$$;

-- Creators, admins of the creator's domain and support staff.
CREATE OR REPLACE FUNCTION public.is_owner_or_tenant_admin(p_owner uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR coalesce(p_owner = auth.uid(), false)
    OR (public.is_tenant_admin() AND public.is_colleague(p_owner));
$$;

CREATE OR REPLACE FUNCTION public.project_row_visible(
  p_id uuid, p_created_by uuid, p_assignee text, p_client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR coalesce(p_created_by = auth.uid(), false)
    OR coalesce(p_assignee = auth.uid()::text, false)
    OR public.is_project_member(p_id)
    OR coalesce(p_client_id = public.get_auth_user_client_id(), false)
    OR public.is_colleague(p_created_by)
    OR public.client_domain_has_access(p_client_id);
$$;

-- Staff on the project or in the creator's domain edit it. Guests never do.
CREATE OR REPLACE FUNCTION public.project_row_editable(
  p_id uuid, p_created_by uuid, p_assignee text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR (
      public.is_staff()
      AND (
        coalesce(p_created_by = auth.uid(), false)
        OR coalesce(p_assignee = auth.uid()::text, false)
        OR public.is_project_member(p_id)
        OR public.is_colleague(p_created_by)
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_view_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND public.project_row_visible(p.id, p.created_by, p.assignee::text, p.client_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND public.project_row_editable(p.id, p.created_by, p.assignee::text)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND public.is_owner_or_tenant_admin(p.created_by)
  );
$$;

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

-- Editing needs the vendor side of the ticket. Seeing it through a client
-- link (guests, or client employees who signed up as users) is not enough.
CREATE OR REPLACE FUNCTION public.ticket_row_editable(
  p_created_by uuid, p_assigned_to text, p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR (
      public.is_staff()
      AND (
        coalesce(p_created_by = auth.uid(), false)
        OR coalesce(p_assigned_to = auth.uid()::text, false)
        OR public.is_project_member(p_project_id)
        OR (p_project_id IS NULL AND public.is_colleague(p_created_by))
        OR public.can_edit_project(p_project_id)
      )
    );
$$;

-- Deleting tickets and documents: the creator, whoever manages the project,
-- and admins of the creator's domain for items outside any project.
CREATE OR REPLACE FUNCTION public.can_manage_item(p_created_by uuid, p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_support_staff()
    OR coalesce(p_created_by = auth.uid(), false)
    OR public.can_manage_project(p_project_id)
    OR (p_project_id IS NULL AND public.is_tenant_admin() AND public.is_colleague(p_created_by));
$$;

CREATE OR REPLACE FUNCTION public.can_view_ticket(p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = p_ticket_id
      AND public.ticket_row_visible(t.created_by, t.assigned_to::text, t.client_id, t.project_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_ticket(p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = p_ticket_id
      AND public.ticket_row_editable(t.created_by, t.assigned_to::text, t.project_id)
  );
$$;

-- Guests also see the client they belong to.
CREATE OR REPLACE FUNCTION public.client_row_visible(p_id uuid, p_owner uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.client_owner_manageable(p_owner)
    OR coalesce(p_id = public.get_auth_user_client_id(), false);
$$;

CREATE OR REPLACE FUNCTION public.can_view_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id
      AND public.client_row_visible(c.id, c.user_id)
  );
$$;

-- The user shares a domain, project or ticket with the caller.
CREATE OR REPLACE FUNCTION public.shares_work_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(p_user_id = auth.uid(), false)
    OR public.is_support_staff()
    OR public.is_colleague(p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE (
          p.created_by = p_user_id
          OR p.assignee::text = p_user_id::text
          OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = p.id AND pm.user_id = p_user_id
          )
        )
        AND public.project_row_visible(p.id, p.created_by, p.assignee::text, p.client_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE (t.created_by = p_user_id OR t.assigned_to::text = p_user_id::text)
        AND public.ticket_row_visible(t.created_by, t.assigned_to::text, t.client_id, t.project_id)
    );
$$;


-- ------------------------------------------------------------------------------
-- 3. TRIGGERS
-- Rules about which columns may change; row policies cannot see OLD.
-- ------------------------------------------------------------------------------

-- The counter is kept by the system, whoever comments.
CREATE OR REPLACE FUNCTION public.update_ticket_comment_count()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tickets
    SET comment_count = comment_count + 1
    WHERE id = NEW.ticket_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tickets
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.ticket_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- The author comes from the session, not from the request body, and only the
-- content of a comment can be edited.
CREATE OR REPLACE FUNCTION public.set_comment_author()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_avatar text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.ticket_id := OLD.ticket_id;
    NEW.user_id := OLD.user_id;
    NEW.user_name := OLD.user_name;
    NEW.user_avatar := OLD.user_avatar;
    RETURN NEW;
  END IF;

  NEW.user_id := auth.uid();
  SELECT name, avatar INTO v_name, v_avatar
  FROM public.user_profiles
  WHERE id = auth.uid();
  IF FOUND THEN
    NEW.user_name := coalesce(v_name, NEW.user_name);
    NEW.user_avatar := coalesce(v_avatar, NEW.user_avatar);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_comment_author ON public.comments;
CREATE TRIGGER set_comment_author
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_comment_author();

CREATE OR REPLACE FUNCTION public.guard_ticket_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Whoever cannot edit the ticket (guests answering an approval) changes
  -- only the status. comment_count is kept by the comment trigger.
  IF NOT public.ticket_row_editable(OLD.created_by, OLD.assigned_to::text, OLD.project_id)
     AND (to_jsonb(NEW) - 'status' - 'updated_at' - 'comment_count')
         IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at' - 'comment_count') THEN
    RAISE EXCEPTION 'you can only change the status of this ticket';
  END IF;

  -- The author decides who may delete the ticket.
  IF NEW.created_by IS DISTINCT FROM OLD.created_by
     AND NOT public.can_manage_item(OLD.created_by, OLD.project_id) THEN
    RAISE EXCEPTION 'only the ticket owner or an admin can change its author';
  END IF;

  IF NEW.project_id IS DISTINCT FROM OLD.project_id
     AND NEW.project_id IS NOT NULL
     AND NOT public.can_view_project(NEW.project_id) THEN
    RAISE EXCEPTION 'you cannot move the ticket into that project';
  END IF;

  -- The project's own client is always allowed, so team members can keep
  -- tickets in sync with the project.
  IF NEW.client_id IS DISTINCT FROM OLD.client_id
     AND NEW.client_id IS NOT NULL
     AND NOT public.can_manage_client(NEW.client_id)
     AND NEW.client_id IS DISTINCT FROM (SELECT client_id FROM public.projects WHERE id = NEW.project_id) THEN
    RAISE EXCEPTION 'you cannot assign the ticket to that client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_ticket_change ON public.tickets;
CREATE TRIGGER guard_ticket_change
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.guard_ticket_change();

CREATE OR REPLACE FUNCTION public.guard_project_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- The app deletes projects by setting deleted_at, which the team edit
  -- policy would otherwise allow.
  IF (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
      OR NEW.created_by IS DISTINCT FROM OLD.created_by)
     AND NOT public.is_owner_or_tenant_admin(OLD.created_by) THEN
    RAISE EXCEPTION 'only the project owner or an admin can delete it or change its owner';
  END IF;

  IF NEW.client_id IS DISTINCT FROM OLD.client_id
     AND NEW.client_id IS NOT NULL
     AND NOT public.can_manage_client(NEW.client_id) THEN
    RAISE EXCEPTION 'you cannot assign the project to that client';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_project_change ON public.projects;
CREATE TRIGGER guard_project_change
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_project_change();


-- ------------------------------------------------------------------------------
-- 4. DROP EVERY EXISTING POLICY ON THE RESET TABLES
-- The current policies are saved first, so
-- supabase/rollback/20261103122000_tenant_isolation_rollback.sql can restore
-- them exactly. The backup schema is not exposed through the API. A re-run
-- keeps the first backup.
-- ------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS backup;
CREATE TABLE IF NOT EXISTS backup.policies_20261103122000 AS
SELECT now() AS saved_at, tablename, policyname, permissive, roles, cmd, qual, with_check
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
        AND policyname IN ('Admins can update all user profiles', 'Admins can update any profile'))
  );

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'projects', 'tickets', 'comments', 'clients', 'contacts',
        'project_members', 'project_documents', 'project_activity_logs',
        'ticket_programs', 'ticket_subtasks', 'ticket_request_types',
        'channels', 'channel_messages', 'notifications', 'messages'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Any admin could rewrite any profile; replaced by domain-scoped policies.
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;


-- ------------------------------------------------------------------------------
-- 5. POLICIES
-- ------------------------------------------------------------------------------

-- PROJECTS ----------------------------------------------------------------------

CREATE POLICY "View projects" ON public.projects
FOR SELECT TO authenticated
USING (public.project_row_visible(id, created_by, assignee::text, client_id));

CREATE POLICY "Create projects" ON public.projects
FOR INSERT TO authenticated
WITH CHECK (
  public.is_support_staff()
  OR (
    public.is_staff()
    AND created_by = auth.uid()
    AND (client_id IS NULL OR public.can_manage_client(client_id))
  )
);

-- guard_project_change limits deleting and ownership changes.
CREATE POLICY "Edit projects" ON public.projects
FOR UPDATE TO authenticated
USING (public.project_row_editable(id, created_by, assignee::text))
WITH CHECK (public.is_support_staff() OR public.is_staff());

CREATE POLICY "Delete projects" ON public.projects
FOR DELETE TO authenticated
USING (public.is_owner_or_tenant_admin(created_by));

-- TICKETS -----------------------------------------------------------------------

CREATE POLICY "View tickets" ON public.tickets
FOR SELECT TO authenticated
USING (public.ticket_row_visible(created_by, assigned_to::text, client_id, project_id));

-- The app fills client_id with the project's client.
CREATE POLICY "Create tickets" ON public.tickets
FOR INSERT TO authenticated
WITH CHECK (
  public.is_support_staff()
  OR (
    public.is_staff()
    AND created_by = auth.uid()
    AND (project_id IS NULL OR public.can_edit_project(project_id))
    AND (
      client_id IS NULL
      OR public.can_manage_client(client_id)
      OR client_id = (SELECT p.client_id FROM public.projects p WHERE p.id = tickets.project_id)
    )
  )
);

-- guard_ticket_change limits author, project and client changes.
CREATE POLICY "Edit tickets" ON public.tickets
FOR UPDATE TO authenticated
USING (public.ticket_row_editable(created_by, assigned_to::text, project_id))
WITH CHECK (public.is_support_staff() OR public.is_staff());

-- Clients approve or send back a delivery. guard_ticket_change keeps their
-- other columns unchanged.
CREATE POLICY "Answer approvals" ON public.tickets
FOR UPDATE TO authenticated
USING (
  status = 'pending_approval'
  AND public.ticket_row_visible(created_by, assigned_to::text, client_id, project_id)
)
WITH CHECK (status IN ('approved', 'ongoing'));

CREATE POLICY "Delete tickets" ON public.tickets
FOR DELETE TO authenticated
USING (public.can_manage_item(created_by, project_id));

-- COMMENTS (authors set by set_comment_author) -----------------------------------

CREATE POLICY "View comments" ON public.comments
FOR SELECT TO authenticated
USING (public.can_view_ticket(ticket_id));

CREATE POLICY "Create comments" ON public.comments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_view_ticket(ticket_id));

-- Comments written before user_id existed have no author, so only support
-- staff edit or delete them.
CREATE POLICY "Edit own comments" ON public.comments
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_support_staff());

CREATE POLICY "Delete own comments" ON public.comments
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_support_staff());

-- CLIENTS AND CONTACTS ------------------------------------------------------------

CREATE POLICY "View clients" ON public.clients
FOR SELECT TO authenticated
USING (public.client_row_visible(id, user_id));

CREATE POLICY "Create clients" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (public.is_support_staff() OR (public.is_staff() AND user_id = auth.uid()));

CREATE POLICY "Edit clients" ON public.clients
FOR UPDATE TO authenticated
USING (public.client_owner_manageable(user_id))
WITH CHECK (public.client_owner_manageable(user_id));

CREATE POLICY "Delete clients" ON public.clients
FOR DELETE TO authenticated
USING (public.is_owner_or_tenant_admin(user_id));

CREATE POLICY "View contacts" ON public.contacts
FOR SELECT TO authenticated
USING (public.can_view_client(client_id));

CREATE POLICY "Create contacts" ON public.contacts
FOR INSERT TO authenticated
WITH CHECK (public.can_manage_client(client_id));

CREATE POLICY "Edit contacts" ON public.contacts
FOR UPDATE TO authenticated
USING (public.can_manage_client(client_id))
WITH CHECK (public.can_manage_client(client_id));

CREATE POLICY "Delete contacts" ON public.contacts
FOR DELETE TO authenticated
USING (public.can_manage_client(client_id));

-- PROJECT MEMBERS -----------------------------------------------------------------

CREATE POLICY "View project members" ON public.project_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.can_view_project(project_id));

CREATE POLICY "Manage project members" ON public.project_members
FOR ALL TO authenticated
USING (public.can_manage_project(project_id))
WITH CHECK (public.can_manage_project(project_id));

-- PROJECT DOCUMENTS ---------------------------------------------------------------

-- Documents without a project are shared with the creator's colleagues.
CREATE POLICY "View project documents" ON public.project_documents
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.is_support_staff()
  OR (project_id IS NOT NULL AND public.can_view_project(project_id))
  OR (project_id IS NULL AND public.is_colleague(created_by))
);

CREATE POLICY "Create project documents" ON public.project_documents
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (project_id IS NULL OR public.can_view_project(project_id))
);

CREATE POLICY "Edit project documents" ON public.project_documents
FOR UPDATE TO authenticated
USING (public.can_manage_item(created_by, project_id))
WITH CHECK (project_id IS NULL OR public.can_view_project(project_id));

CREATE POLICY "Delete project documents" ON public.project_documents
FOR DELETE TO authenticated
USING (public.can_manage_item(created_by, project_id));

-- ACTIVITY LOGS -------------------------------------------------------------------

CREATE POLICY "View activity logs" ON public.project_activity_logs
FOR SELECT TO authenticated
USING (public.can_view_project(project_id));

CREATE POLICY "Create activity logs" ON public.project_activity_logs
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_view_project(project_id));

-- TICKET PROGRAMS AND SUBTASKS (written by those who can edit the ticket) --------

CREATE POLICY "View ticket programs" ON public.ticket_programs
FOR SELECT TO authenticated
USING (public.can_view_ticket(ticket_id));

CREATE POLICY "Manage ticket programs" ON public.ticket_programs
FOR ALL TO authenticated
USING (public.can_edit_ticket(ticket_id))
WITH CHECK (public.can_edit_ticket(ticket_id));

CREATE POLICY "View ticket subtasks" ON public.ticket_subtasks
FOR SELECT TO authenticated
USING (public.can_view_ticket(ticket_id));

CREATE POLICY "Manage ticket subtasks" ON public.ticket_subtasks
FOR ALL TO authenticated
USING (public.can_edit_ticket(ticket_id))
WITH CHECK (public.can_edit_ticket(ticket_id));

-- REQUEST TYPES (one list shared by every tenant) ---------------------------------

CREATE POLICY "Read request types" ON public.ticket_request_types
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage request types" ON public.ticket_request_types
FOR ALL TO authenticated
USING (public.is_support_staff() OR public.is_tenant_admin())
WITH CHECK (public.is_support_staff() OR public.is_tenant_admin());

-- TEAM CHANNELS (one space per private domain) ------------------------------------

CREATE POLICY "View domain channels" ON public.channels
FOR SELECT TO authenticated
USING (domain = public.my_private_domain());

CREATE POLICY "Create domain channels" ON public.channels
FOR INSERT TO authenticated
WITH CHECK (domain = public.my_private_domain() AND created_by = auth.uid());

CREATE POLICY "View channel messages" ON public.channel_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_messages.channel_id
      AND c.domain = public.my_private_domain()
  )
);

CREATE POLICY "Send channel messages" ON public.channel_messages
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_messages.channel_id
      AND c.domain = public.my_private_domain()
  )
);

-- MESSAGES ------------------------------------------------------------------------
-- Only the unrouted ContactUs page used this table, so it keeps no policy and
-- nobody can read or write it.

-- NOTIFICATIONS -------------------------------------------------------------------

CREATE POLICY "View own notifications" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Update own notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users notify people they work with, and links stay inside the app.
CREATE POLICY "Notify collaborators" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
  public.shares_work_with(user_id)
  AND (link IS NULL OR link ~ '^/[^/\\]')
);

-- USER PROFILES (protect_user_profile_columns guards the columns) -----------------

DROP POLICY IF EXISTS "Tenant admins update their domain" ON public.user_profiles;
CREATE POLICY "Tenant admins update their domain" ON public.user_profiles
FOR UPDATE TO authenticated
USING (public.is_tenant_admin() AND public.is_colleague(id))
WITH CHECK (public.is_tenant_admin() AND public.is_colleague(id));

DROP POLICY IF EXISTS "Support staff update any profile" ON public.user_profiles;
CREATE POLICY "Support staff update any profile" ON public.user_profiles
FOR UPDATE TO authenticated
USING (public.is_support_staff())
WITH CHECK (public.is_support_staff());

-- Client portal invitations link users of other domains to the editor's
-- clients; the trigger lets only the client link change.
DROP POLICY IF EXISTS "Staff link users to their clients" ON public.user_profiles;
CREATE POLICY "Staff link users to their clients" ON public.user_profiles
FOR UPDATE TO authenticated
USING (
  public.is_staff()
  AND id <> auth.uid()
  AND (client_id IS NULL OR public.can_manage_client(client_id))
)
WITH CHECK (
  public.is_staff()
  AND (client_id IS NULL OR public.can_manage_client(client_id))
);
