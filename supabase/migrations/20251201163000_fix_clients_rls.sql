-- Habilitar RLS en clients (por si acaso no lo está)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON clients;
DROP POLICY IF EXISTS "Allow all for authenticated" ON clients;

-- Crear política permisiva para usuarios autenticados
CREATE POLICY "Allow all for authenticated" ON clients
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
