-- Fix ticket request type constraint
-- 1. Ensure ALL standard types exist in the reference table to prevent FK errors
insert into ticket_request_types (value, label, description) values
('feature', 'Requerimiento de Adecuación', 'Solicitar una nueva funcionalidad o cambio en el sistema'),
('bug', 'Incidencia Reportada', 'Reportar un error o fallo en el sistema'),
('enhancement', 'Solicitud de Mejora', 'Propuesta para mejorar una funcionalidad existente'),
('consult', 'Consulta', 'Preguntas generales sobre el sistema'),
('other', 'Otro', 'Cualquier otro tipo de solicitud'),
('support', 'Soporte', 'Solicitud de soporte general'),
('documentation', 'Documentación', 'Solicitud de documentación')
on conflict (value) do nothing;

-- 2. Drop the restrictive hardcoded check constraint if it exists
alter table tickets drop constraint if exists tickets_request_type_check;

-- 3. Add Foreign Key constraint to ensure validity against the dynamic table
-- This allows admins to add new types without changing the schema
alter table tickets 
  add constraint tickets_request_type_fkey 
  foreign key (request_type) 
  references ticket_request_types(value)
  on update cascade;
