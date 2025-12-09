-- 1. Agregar columna client_id a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_id ON user_profiles(client_id);

-- 2. Actualizar políticas RLS para tickets

-- Primero, eliminamos la política permisiva anterior si existe
DROP POLICY IF EXISTS "Allow all for authenticated" ON tickets;
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;

-- Política para VER tickets (SELECT)
CREATE POLICY "View tickets based on role" ON tickets
FOR SELECT
TO authenticated
USING (
  -- Admin y Staff (role 'user' o 'admin') pueden ver todo
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'user')
      AND client_id IS NULL -- Asumimos que staff no tiene client_id
    )
  )
  OR
  -- Clientes solo pueden ver sus propios tickets
  (
    client_id IN (
      SELECT client_id FROM user_profiles
      WHERE id = auth.uid()
      AND client_id IS NOT NULL
    )
  )
);

-- Política para CREAR tickets (INSERT)
-- Clientes pueden crear tickets para sí mismos
CREATE POLICY "Create tickets based on role" ON tickets
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin y Staff pueden crear cualquier ticket
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'user')
      AND client_id IS NULL
    )
  )
  OR
  -- Clientes solo pueden crear tickets para su propia compañía
  (
    client_id IN (
      SELECT client_id FROM user_profiles
      WHERE id = auth.uid()
      AND client_id IS NOT NULL
    )
  )
);

-- Política para ACTUALIZAR tickets (UPDATE)
-- Clientes solo pueden actualizar ciertos campos (opcional, por ahora dejamos que editen sus tickets)
CREATE POLICY "Update tickets based on role" ON tickets
FOR UPDATE
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'user')
      AND client_id IS NULL
    )
  )
  OR
  (
    client_id IN (
      SELECT client_id FROM user_profiles
      WHERE id = auth.uid()
      AND client_id IS NOT NULL
    )
  )
);
