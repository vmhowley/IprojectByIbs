-- Simplificar políticas para debugging
-- Permitir acceso total a usuarios autenticados temporalmente para descartar problemas de RLS complejos

-- Políticas para projects
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for project owners" ON projects;
DROP POLICY IF EXISTS "Enable delete for project owners" ON projects;

CREATE POLICY "Allow all for authenticated" ON projects
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para tickets
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable update for ticket creators and assignees" ON tickets;
DROP POLICY IF EXISTS "Enable delete for ticket creators" ON tickets;

CREATE POLICY "Allow all for authenticated" ON tickets
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
