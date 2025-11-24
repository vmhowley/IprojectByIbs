/*
  # Project Tracker Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `task_number` (text, unique identifier like TSK-1)
      - `title` (text)
      - `description` (text, nullable)
      - `status` (text: ongoing, completed, in_review, pending)
      - `urgency` (text: critical, moderate, minor)
      - `category` (text, nullable)
      - `department` (text, nullable)
      - `assigned_to` (text, nullable)
      - `date_added` (timestamptz)
      - `deadline` (timestamptz, nullable)
      - `tags` (text array)
      - `comment_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (for demo purposes)
    
  3. Indexes
    - Index on project_id for faster task queries
    - Index on status for filtering
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  urgency text NOT NULL DEFAULT 'moderate',
  category text,
  department text,
  assigned_to text,
  date_added timestamptz DEFAULT now(),
  deadline timestamptz,
  tags text[] DEFAULT '{}',
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_urgency ON tasks(urgency);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
CREATE POLICY "Public can view projects"
  ON projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert projects"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update projects"
  ON projects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view tasks"
  ON tasks FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert tasks"
  ON tasks FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update tasks"
  ON tasks FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete tasks"
  ON tasks FOR DELETE
  TO anon
  USING (true);