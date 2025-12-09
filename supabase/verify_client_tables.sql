-- Verificar si las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'contacts');

-- Verificar estructura de la tabla clients
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Verificar estructura de la tabla contacts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contacts'
ORDER BY ordinal_position;

-- Verificar si hay políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('clients', 'contacts');
