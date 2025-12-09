-- 1. Agregar columna client_id a projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- 2. Reactivar RLS en projects (lo habíamos desactivado antes)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Actualizar políticas RLS para projects

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Allow all for authenticated" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;

-- Política de LECTURA (SELECT)
CREATE POLICY "View projects based on contact" ON projects
FOR SELECT
TO authenticated
USING (
  -- Admin y Staff (sin contact_id) ven todo
  (get_auth_user_client_id() IS NULL)
  OR
  -- Contactos ven solo proyectos de su cliente
  (client_id = get_auth_user_client_id())
);

-- Política de CREACIÓN (INSERT)
-- Solo Admin/Staff deberían crear proyectos normalmente, pero si quieres que clientes creen:
CREATE POLICY "Create projects based on role" ON projects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo Admin y Staff pueden crear proyectos (por ahora)
  (get_auth_user_client_id() IS NULL)
);

-- Política de ACTUALIZACIÓN (UPDATE)
CREATE POLICY "Update projects based on role" ON projects
FOR UPDATE
TO authenticated
USING (
  -- Solo Admin y Staff pueden editar proyectos
  (get_auth_user_client_id() IS NULL)
);
