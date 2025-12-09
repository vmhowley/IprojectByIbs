/*
  # Add Project Fields
  
  1. New Columns
    - `assignee` (text, nullable)
    - `status` (text, default 'active')
    - `start_date` (date, nullable)
    - `end_date` (date, nullable)
    - `priority` (text, default 'medium')
    - `team` (text, nullable)
    - `file_attachment` (text, nullable)
*/

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS assignee text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS team text,
ADD COLUMN IF NOT EXISTS file_attachment text;
