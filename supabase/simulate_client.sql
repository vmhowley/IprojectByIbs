-- SCRIPT PARA SIMULAR SER UN CLIENTE
-- Reemplaza 'vmhowleyh@gmail.com' con tu email si es diferente

DO $$
DECLARE
  v_user_email TEXT := 'vmhowleyh@gmail.com'; -- <--- TU EMAIL
  v_client_id UUID;
  v_contact_id UUID;
  v_project_id UUID;
BEGIN
  -- 1. Buscar un cliente existente
  SELECT id INTO v_client_id FROM clients LIMIT 1;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'No hay clientes en la base de datos. Crea uno primero.';
  END IF;

  -- 2. Buscar un contacto para ese cliente (o crear uno si no existe)
  SELECT id INTO v_contact_id FROM contacts WHERE client_id = v_client_id LIMIT 1;
  
  IF v_contact_id IS NULL THEN
    INSERT INTO contacts (client_id, name, email, is_primary)
    VALUES (v_client_id, 'Contacto de Prueba', 'test@cliente.com', true)
    RETURNING id INTO v_contact_id;
  END IF;

  -- 3. Buscar un proyecto para asignar (o crear uno)
  SELECT id INTO v_project_id FROM projects LIMIT 1;
  
  IF v_project_id IS NULL THEN
    INSERT INTO projects (name, status, created_at, updated_at)
    VALUES ('Proyecto de Prueba Cliente', 'active', now(), now())
    RETURNING id INTO v_project_id;
  END IF;

  -- 4. ASIGNAR EL PROYECTO AL CLIENTE
  UPDATE projects SET client_id = v_client_id WHERE id = v_project_id;
  
  -- 5. VINCULAR TU USUARIO AL CONTACTO (Te conviertes en cliente)
  UPDATE user_profiles SET contact_id = v_contact_id WHERE email = v_user_email;

  RAISE NOTICE 'SUCCESS! Ahora eres el contacto % del cliente %. El proyecto % ha sido asignado a este cliente.', v_contact_id, v_client_id, v_project_id;
  RAISE NOTICE 'Recarga la página. Deberías ver SOLO el proyecto asignado.';

END $$;
