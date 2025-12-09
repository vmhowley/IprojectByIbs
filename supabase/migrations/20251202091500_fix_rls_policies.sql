-- Drop permissive policies that were overriding the contact-based restrictions
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON tickets;

-- Also ensure we drop any other potential permissive policies
DROP POLICY IF EXISTS "Public can view projects" ON projects;
DROP POLICY IF EXISTS "Public can view tasks" ON tickets;
