-- ==============================================================================
-- PROJECT QUOTES
-- The quote behind a project's price, as the document sent to the client
-- (Excel, Word, PDF). It is money, so only admins who work on the project see
-- it, the same people who see the price. The file lives in the private bucket
-- "quotes" under <project id>/, and the row and the file follow the same rule.
-- Deleting a project deletes its rows; the files stay in storage.
-- Requires 20261105120000_storage_lockdown.sql: the old public storage policies
-- would let anyone read this bucket too. Rollback:
-- supabase/rollback/20261105121000_project_quotes_rollback.sql
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'Public can % ticket attachments m6jz3j_0'
  ) THEN
    RAISE EXCEPTION 'Apply 20261105120000_storage_lockdown.sql first';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  file_path text NOT NULL UNIQUE,
  file_type text,
  file_size bigint,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_quotes_project_id_idx ON public.project_quotes (project_id);

ALTER TABLE public.project_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_quotes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_quotes TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. HELPERS
-- ------------------------------------------------------------------------------

-- Admins who work on the project. Support staff and everyone else never see it.
CREATE OR REPLACE FUNCTION public.can_see_quotes(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    AND public.can_edit_project(p_project_id);
$$;

-- A file in the quotes bucket belongs to the project named by its folder.
CREATE OR REPLACE FUNCTION public.can_see_quote_file(p_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
      THEN public.can_see_quotes(split_part(p_name, '/', 1)::uuid)
    ELSE false
  END;
$$;

-- ------------------------------------------------------------------------------
-- 3. POLICIES ON THE TABLE
-- A row always points to a file in its own project's folder.
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "View quotes" ON public.project_quotes;
CREATE POLICY "View quotes" ON public.project_quotes
FOR SELECT TO authenticated
USING (public.can_see_quotes(project_id));

DROP POLICY IF EXISTS "Add quotes" ON public.project_quotes;
CREATE POLICY "Add quotes" ON public.project_quotes
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.can_see_quotes(project_id)
  AND split_part(file_path, '/', 1) = project_id::text
);

DROP POLICY IF EXISTS "Rename quotes" ON public.project_quotes;
CREATE POLICY "Rename quotes" ON public.project_quotes
FOR UPDATE TO authenticated
USING (public.can_see_quotes(project_id))
WITH CHECK (
  public.can_see_quotes(project_id)
  AND split_part(file_path, '/', 1) = project_id::text
);

DROP POLICY IF EXISTS "Delete quotes" ON public.project_quotes;
CREATE POLICY "Delete quotes" ON public.project_quotes
FOR DELETE TO authenticated
USING (public.can_see_quotes(project_id));

-- ------------------------------------------------------------------------------
-- 4. PRIVATE BUCKET AND ITS POLICIES
-- Files are read through short signed links, never by a public URL.
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('quotes', 'quotes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Read quote files" ON storage.objects;
CREATE POLICY "Read quote files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'quotes' AND public.can_see_quote_file(name));

DROP POLICY IF EXISTS "Add quote files" ON storage.objects;
CREATE POLICY "Add quote files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'quotes' AND public.can_see_quote_file(name));

DROP POLICY IF EXISTS "Delete quote files" ON storage.objects;
CREATE POLICY "Delete quote files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'quotes' AND public.can_see_quote_file(name));

-- The API picks up the new table without waiting for its next reload.
NOTIFY pgrst, 'reload schema';
