-- Helper function to extract domain from email (CASE INSENSITIVE)
create or replace function get_email_domain(email text)
returns text language sql immutable as $$
  select lower(split_part(email, '@', 2));
$$;

-- Helper function to check if domain is public (blacklist)
create or replace function is_public_domain(domain text)
returns boolean language sql immutable as $$
  select lower(domain) in (
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'protonmail.com',
    'zoho.com',
    'yandex.com',
    'mail.com',
    'gmx.com'
  );
$$;

-- Helper function to get CURRENT USER EMAIL DOMAIN from user_profiles
create or replace function get_my_email_domain()
returns text language sql stable security definer as $$
  select get_email_domain(email)
  from user_profiles
  where id = auth.uid();
$$;

-- Helper function to get ANY USER EMAIL DOMAIN
create or replace function get_user_domain_by_id(user_id uuid)
returns text language sql stable security definer as $$
  select get_email_domain(email)
  from user_profiles
  where id = user_id;
$$;

-- Helper function to check if a domain has any contact for a given client
create or replace function domain_has_client_access(p_domain text, p_client_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
        select 1 
        from user_profiles colleague
        join contacts c on c.id = colleague.contact_id
        where c.client_id = p_client_id
        and get_email_domain(colleague.email) = p_domain
  );
$$;

-- Helper function to checks if user is Admin or TRUSTED Staff
-- Trusted Staff = role 'user' but NOT public domain
create or replace function is_admin_or_staff()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid()
    and (
      role = 'admin' 
      OR 
      (role = 'user' AND NOT is_public_domain(get_email_domain(email)))
    )
  );
$$;

-- ==========================================
-- REVERT DEFAULT ROLE TO 'USER'
-- ==========================================
-- New users will be 'user' by default, as requested.
-- Security is handled by is_admin_or_staff() which checks domain.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- DROPPING ALL LEGACY POLICIES (NUCLEAR OPTION)
-- ==========================================
DROP POLICY IF EXISTS "View projects based on contact and domain" ON projects;
DROP POLICY IF EXISTS "View projects based on contact" ON projects;
DROP POLICY IF EXISTS "View projects based on role" ON projects; -- ROGUE POLICY
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Allow all for authenticated" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Public can view projects" ON projects;

DROP POLICY IF EXISTS "View tickets based on contact and domain" ON tickets;
DROP POLICY IF EXISTS "View tickets based on contact" ON tickets;
DROP POLICY IF EXISTS "View tickets based on role" ON tickets; -- ROGUE POLICY
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON tickets;
DROP POLICY IF EXISTS "Allow all for authenticated" ON tickets;
DROP POLICY IF EXISTS "Public can view tasks" ON tickets;

-- ==========================================
-- PROJECTS RLS
-- ==========================================
CREATE POLICY "View projects based on contact and domain" ON projects
FOR SELECT
TO authenticated
USING (
  -- 1. Admin/Trusted Staff (Explicit Role Check + Domain Check) - NO PUBLIC EMAIL USERS
  (
     get_auth_user_client_id() IS NULL 
     AND 
     is_admin_or_staff()
  )
  OR
  -- 2. Client Contact sees projects assigned to their client_id
  (client_id = get_auth_user_client_id())
  OR
  -- 3. Explicit Project Member
  (
    exists (
        select 1 from project_members pm 
        where pm.project_id = projects.id 
        and pm.user_id = auth.uid()
    )
  )
  OR
  -- 4. Business Domain Visibility:
  (
    NOT is_public_domain(get_my_email_domain()) 
    AND 
    (
      -- A. Created by colleague (same domain)
      (get_user_domain_by_id(projects.created_by) = get_my_email_domain())
      OR
      -- B. Belong to a Client that has a colleague as contact
      (domain_has_client_access(get_my_email_domain(), projects.client_id))
    )
  )
);

-- ==========================================
-- TICKETS RLS
-- ==========================================
CREATE POLICY "View tickets based on contact and domain" ON tickets
FOR SELECT
TO authenticated
USING (
  -- 1. Admin/Trusted Staff (Explicit Role Check + Domain Check)
  (
     get_auth_user_client_id() IS NULL 
     AND 
     is_admin_or_staff()
  )
  OR
  -- 2. Owner of the ticket
  (created_by = auth.uid())
  OR
  -- 3. Client Contact sees tickets assigned to their client_id
  (client_id = get_auth_user_client_id())
  OR
  -- 4. Explicit Project Member (via project)
  (
    exists (
        select 1 from project_members pm 
        where pm.project_id = tickets.project_id 
        and pm.user_id = auth.uid()
    )
  )
  OR
  -- 5. Business Domain Visibility:
  (
    NOT is_public_domain(get_my_email_domain()) 
    AND 
    (
      -- A. Created by colleague (same domain)
      (get_user_domain_by_id(tickets.created_by) = get_my_email_domain())
      OR
      -- B. Belong to a Client that has a colleague as contact
      (domain_has_client_access(get_my_email_domain(), tickets.client_id))
    )
  )
);
