-- ==============================================================================
-- ROLLBACK OF 20261105121000_project_quotes.sql
-- Removes the policies of the quotes bucket and of project_quotes, so nobody
-- reaches either. It deletes no row and no file: the table, the bucket and the
-- documents stay where they are, and applying the migration again restores
-- access as it was.
-- Not a migration: run it by hand in the SQL editor.
-- ==============================================================================

DROP POLICY IF EXISTS "Read quote files" ON storage.objects;
DROP POLICY IF EXISTS "Add quote files" ON storage.objects;
DROP POLICY IF EXISTS "Delete quote files" ON storage.objects;

DROP POLICY IF EXISTS "View quotes" ON public.project_quotes;
DROP POLICY IF EXISTS "Add quotes" ON public.project_quotes;
DROP POLICY IF EXISTS "Rename quotes" ON public.project_quotes;
DROP POLICY IF EXISTS "Delete quotes" ON public.project_quotes;
