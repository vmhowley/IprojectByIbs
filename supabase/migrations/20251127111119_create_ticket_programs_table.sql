/*
  # Create ticket_programs table

  1. New Tables
    - `ticket_programs`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key to tickets)
      - `object_name` (text)
      - `object_type` (text)
      - `attribute` (text)
      - `description` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ticket_programs` table
    - Add policies for public access (matching existing patterns)

  3. Triggers
    - Update updated_at timestamp
*/

CREATE TABLE IF NOT EXISTS ticket_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  object_name text NOT NULL,
  object_type text NOT NULL,
  attribute text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ticket_programs ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for now, matching project style)
DROP POLICY IF EXISTS "Enable read access for all users" ON ticket_programs;
CREATE POLICY "Enable read access for all users"
  ON ticket_programs FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON ticket_programs;
CREATE POLICY "Enable insert access for all users"
  ON ticket_programs FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON ticket_programs;
CREATE POLICY "Enable update access for all users"
  ON ticket_programs FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON ticket_programs;
CREATE POLICY "Enable delete access for all users"
  ON ticket_programs FOR DELETE
  TO public
  USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ticket_programs_ticket_id ON ticket_programs(ticket_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_ticket_programs_updated_at ON ticket_programs;
CREATE TRIGGER update_ticket_programs_updated_at
  BEFORE UPDATE ON ticket_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
