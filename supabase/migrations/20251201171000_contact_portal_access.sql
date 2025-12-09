-- 1. Agregar columna contact_id a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_contact_id ON user_profiles(contact_id);

-- 2. Actualizar políticas RLS para tickets

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Allow all for authenticated" ON tickets;
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;
DROP POLICY IF EXISTS "View tickets based on role" ON tickets;
DROP POLICY IF EXISTS "Create tickets based on role" ON tickets;
DROP POLICY IF EXISTS "Update tickets based on role" ON tickets;

-- Eliminar políticas nuevas si ya existen (para evitar errores al re-correr)
DROP POLICY IF EXISTS "View tickets based on contact" ON tickets;
DROP POLICY IF EXISTS "Create tickets based on contact" ON tickets;
DROP POLICY IF EXISTS "Update tickets based on contact" ON tickets;

-- Función auxiliar para obtener el client_id del usuario actual
-- Esto hace las políticas mucho más limpias y rápidas
CREATE OR REPLACE FUNCTION get_auth_user_client_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT c.client_id
    FROM user_profiles up
    JOIN contacts c ON c.id = up.contact_id
    WHERE up.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política de LECTURA (SELECT)
CREATE POLICY "View tickets based on contact" ON tickets
FOR SELECT
TO authenticated
USING (
  -- Admin y Staff (sin contact_id) ven todo
  (get_auth_user_client_id() IS NULL)
  OR
  -- Contactos ven solo tickets de su cliente
  (client_id = get_auth_user_client_id())
);

-- Política de CREACIÓN (INSERT)
CREATE POLICY "Create tickets based on contact" ON tickets
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin y Staff pueden crear para cualquiera
  (get_auth_user_client_id() IS NULL)
  OR
  -- Contactos solo pueden crear para su cliente
  (client_id = get_auth_user_client_id())
);

-- Política de ACTUALIZACIÓN (UPDATE)
CREATE POLICY "Update tickets based on contact" ON tickets
FOR UPDATE
TO authenticated
USING (
  (get_auth_user_client_id() IS NULL)
  OR
  (client_id = get_auth_user_client_id())
);
