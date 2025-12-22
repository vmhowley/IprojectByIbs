/*
  # Add Soft Delete to Projects

  1. Changes
    - Add `deleted_at` column to `projects` table (nullable, default null)
  
  2. Purpose
    - Allow soft deletion of projects to preserve activity logs and other related data.
*/

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Optional: Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
