-- Agregar columnas faltantes a la tabla tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id),
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS request_type TEXT;

-- Opcional: Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON tickets(contact_id);
