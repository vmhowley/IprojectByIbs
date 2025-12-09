/*
  # Authentication and Role-Based Access Control

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `role` (text: admin, user, guest)
      - `avatar` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Schema Changes
    - Add `created_by` column to `projects` table
    - Add `created_by` column to `tickets` table

  3. Security Updates
    - Replace public RLS policies with authenticated policies
    - Add role-based policies for write operations
    - Ensure users can only modify their own resources (except admins)

  4. Triggers
    - Auto-create user profile when new user signs up
    - Auto-update `updated_at` timestamps
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
  avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add created_by to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by to tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old public policies for projects
DROP POLICY IF EXISTS "Public can view projects" ON projects;
DROP POLICY IF EXISTS "Public can insert projects" ON projects;
DROP POLICY IF EXISTS "Public can update projects" ON projects;
DROP POLICY IF EXISTS "Public can delete projects" ON projects;

-- Drop old public policies for tickets
DROP POLICY IF EXISTS "Public can view tasks" ON tickets;
DROP POLICY IF EXISTS "Public can insert tasks" ON tickets;
DROP POLICY IF EXISTS "Public can update tasks" ON tickets;
DROP POLICY IF EXISTS "Public can delete tasks" ON tickets;

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Projects Policies
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects or admins can update any" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects or admins can delete any" ON projects;

CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own projects or admins can update any"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own projects or admins can delete any"
  ON projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tickets Policies
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update own tickets or admins can update any" ON tickets;
DROP POLICY IF EXISTS "Users can delete own tickets or admins can delete any" ON tickets;

CREATE POLICY "Authenticated users can view tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own tickets or admins can update any"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own tickets or admins can delete any"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
