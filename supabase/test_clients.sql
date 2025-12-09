-- Verificar que las tablas existen
SELECT 'clients' as table_name, COUNT(*) as row_count FROM clients
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts;

-- Ver estructura de clients
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Intentar insertar un cliente de prueba
INSERT INTO clients (name, email, phone)
VALUES ('Test Company', 'test@example.com', '123-456-7890')
RETURNING *;
