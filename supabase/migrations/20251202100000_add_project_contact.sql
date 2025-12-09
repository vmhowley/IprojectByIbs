-- Add contact_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_contact_id ON projects(contact_id);
