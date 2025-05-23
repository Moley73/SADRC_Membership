-- SQL to update RLS policies to include Editor role

-- First, disable RLS temporarily
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS \
Users
can
view
their
own
roles\ ON user_roles;
DROP POLICY IF EXISTS \Admins
can
manage
user
roles\ ON user_roles;

-- Create updated policies
-- Users can view their own role
CREATE POLICY \Users
can
view
their
own
roles\ 
ON user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Admins and Editors can manage user roles (with different permissions)
CREATE POLICY \Admins
can
manage
user
roles\ 
ON user_roles FOR ALL 
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM admin_list WHERE role ILIKE '%admin%'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM admin_list WHERE role ILIKE '%admin%'
  )
);

-- Editors can only view user roles (read-only access)
CREATE POLICY \Editors
can
view
user
roles\ 
ON user_roles FOR SELECT 
USING (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM admin_list WHERE role ILIKE '%editor%'
  )
);

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Output the SQL to run in Supabase SQL Editor
