-- 1. Mejorar la función para que sea más robusta
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

-- 2. Corregir la política de proyectos para ser SEGURA POR DEFECTO
DROP POLICY IF EXISTS "View projects based on contact" ON projects;

CREATE POLICY "View projects based on contact" ON projects
FOR SELECT TO authenticated
USING (
  -- CASO 1: Admin o Staff (role explícito Y sin cliente asignado)
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'user') -- Asegurar que tiene rol de staff
      AND contact_id IS NULL -- Asegurar que NO es un contacto externo
    )
  )
  OR
  -- CASO 2: Cliente (tiene que coincidir el ID)
  (
    client_id = get_auth_user_client_id()
  )
);

-- Aplicar la misma lógica a Tickets para asegurar consistencia
DROP POLICY IF EXISTS "View tickets based on contact" ON tickets;

CREATE POLICY "View tickets based on contact" ON tickets
FOR SELECT TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'user')
      AND contact_id IS NULL
    )
  )
  OR
  (
    client_id = get_auth_user_client_id()
  )
);
