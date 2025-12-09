/*
  # Add Clients and Contacts Management
  
  1. New Tables
    - `clients` (Empresas/Organizaciones)
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, nullable)
      - `phone` (text, nullable)
      - `address` (text, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contacts` (Personas de contacto)
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `name` (text, required)
      - `email` (text, nullable)
      - `phone` (text, nullable)
      - `position` (text, nullable)
      - `is_primary` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Schema Changes
    - Drop `client` and `contact` text columns from tickets
    - Add `client_id` and `contact_id` foreign keys to tickets
    
  3. Indexes
    - Index on clients.name for search
    - Index on contacts.client_id for filtering
    - Index on contacts.name for search
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  position text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- Update tickets table
ALTER TABLE tickets
DROP COLUMN IF EXISTS client,
DROP COLUMN IF EXISTS contact,
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES contacts(id);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
CREATE POLICY "Public can view clients"
  ON clients FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert clients"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update clients"
  ON clients FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view contacts"
  ON contacts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert contacts"
  ON contacts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update contacts"
  ON contacts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
