/*
  # Rename tasks table to tickets and add comments system

  1. Schema Changes
    - Rename `tasks` table to `tickets`
    - Update `task_number` column to `ticket_number`
    - Update status values to match Jira convention (todo, in_progress, done)
    - Add priority values (low, medium, high, critical)
    
  2. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key to tickets)
      - `user_name` (text)
      - `user_avatar` (text, nullable)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  3. Security
    - Enable RLS on `tickets` table
    - Enable RLS on `comments` table
    - Add policies for public access (will be restricted when auth is added)
    
  4. Triggers
    - Update comment_count on tickets when comments are added/removed
*/

-- Rename tasks table to tickets
ALTER TABLE IF EXISTS tasks RENAME TO tickets;

-- Rename task_number column to ticket_number
ALTER TABLE IF EXISTS tickets RENAME COLUMN task_number TO ticket_number;

-- Update status values to match new convention
DO $$
BEGIN
  -- Update status enum if needed
  ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tasks_status_check;
  ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
  ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
    CHECK (status IN ('todo', 'in_progress', 'done', 'ongoing', 'completed', 'in_review', 'pending'));
END $$;

-- Update urgency to priority terminology
DO $$
BEGIN
  ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tasks_urgency_check;
  ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_urgency_check;
  ALTER TABLE tickets ADD CONSTRAINT tickets_priority_check 
    CHECK (urgency IN ('low', 'medium', 'high', 'critical', 'minor', 'moderate'));
END $$;

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT 'Anonymous',
  user_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on tickets (was tasks)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to tickets
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;
CREATE POLICY "Enable read access for all users"
  ON tickets FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON tickets;
CREATE POLICY "Enable insert access for all users"
  ON tickets FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON tickets;
CREATE POLICY "Enable update access for all users"
  ON tickets FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON tickets;
CREATE POLICY "Enable delete access for all users"
  ON tickets FOR DELETE
  TO public
  USING (true);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
DROP POLICY IF EXISTS "Enable read access for all users" ON comments;
CREATE POLICY "Enable read access for all users"
  ON comments FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON comments;
CREATE POLICY "Enable insert access for all users"
  ON comments FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON comments;
CREATE POLICY "Enable update access for all users"
  ON comments FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON comments;
CREATE POLICY "Enable delete access for all users"
  ON comments FOR DELETE
  TO public
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Create function to update comment count
CREATE OR REPLACE FUNCTION update_ticket_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tickets 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.ticket_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tickets 
    SET comment_count = GREATEST(0, comment_count - 1) 
    WHERE id = OLD.ticket_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update comment count
DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_comment_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comments updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
