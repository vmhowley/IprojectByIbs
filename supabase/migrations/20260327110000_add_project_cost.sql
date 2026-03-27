-- Add cost and currency columns to projects table
alter table projects
add column cost numeric(12, 2),
add column currency text default 'DOP';

-- Comment on columns for clarity
comment on column projects.cost is 'Project cost for quotes, restricted to admins in UI';
comment on column projects.currency is 'Currency code (DOP, USD, etc.)';
