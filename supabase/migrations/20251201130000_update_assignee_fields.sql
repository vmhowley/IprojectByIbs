/*
  # Update Assignee Fields to Reference Users

  1. Changes
    - Convert `assignee` in projects to reference user_profiles
    - Convert `assigned_to` in tickets to reference user_profiles
    - Add foreign key constraints
*/

-- Update projects assignee to be a UUID reference
-- First, set any non-UUID values to NULL
UPDATE projects 
SET assignee = NULL 
WHERE assignee IS NOT NULL 
  AND assignee !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Change column type to UUID
ALTER TABLE projects 
ALTER COLUMN assignee TYPE uuid USING assignee::uuid;

-- Add foreign key constraint
ALTER TABLE projects
ADD CONSTRAINT fk_projects_assignee 
FOREIGN KEY (assignee) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Update tickets assigned_to to be a UUID reference
-- First, set any non-UUID values to NULL
UPDATE tickets 
SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
  AND assigned_to !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Change column type to UUID
ALTER TABLE tickets 
ALTER COLUMN assigned_to TYPE uuid USING assigned_to::uuid;

-- Add foreign key constraint
ALTER TABLE tickets
ADD CONSTRAINT fk_tickets_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_assignee ON projects(assignee);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
