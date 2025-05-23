-- SQL to fix infinite recursion in RLS policies

-- 1. First fix admin_list table policies
-- Disable RLS temporarily
ALTER TABLE admin_list DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS \
Super
admins
can
manage
admin_list\ ON admin_list;
DROP POLICY IF EXISTS \Anyone
can
read
admin_list\ ON admin_list;

-- Create simpler policies with no circular references
-- Policy 1: Anyone can read admin_list (no auth check needed)
CREATE POLICY \Anyone
can
read
admin_list\ 
ON admin_list FOR SELECT 
USING (true);

-- Policy 2: Super admins can manage admin_list
-- Use a direct email check for the super admin
CREATE POLICY \Super
admins
can
manage
admin_list\ 
ON admin_list FOR ALL 
USING (
  auth.jwt() ->> 'email' = 'briandarrington@btinternet.com' OR
  EXISTS (
    SELECT 1 FROM admin_list 
    WHERE email = auth.jwt() ->> 'email' 
    AND role ILIKE '%super%'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'briandarrington@btinternet.com' OR
  EXISTS (
    SELECT 1 FROM admin_list 
    WHERE email = auth.jwt() ->> 'email' 
    AND role ILIKE '%super%'
  )
);

-- Re-enable RLS
ALTER TABLE admin_list ENABLE ROW LEVEL SECURITY;

-- 2. Now fix user_roles table policies
-- Disable RLS temporarily
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS \Users
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
DROP POLICY IF EXISTS \Editors
can
view
user
roles\ ON user_roles;

-- Create new policies
-- Policy 1: Users can view their own role
CREATE POLICY \Users
can
view
their
own
roles\ 
ON user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Admins can manage user roles
CREATE POLICY \Admins
can
manage
user
roles\ 
ON user_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_list 
    WHERE email = auth.jwt() ->> 'email' 
    AND (role ILIKE '%admin%')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_list 
    WHERE email = auth.jwt() ->> 'email' 
    AND (role ILIKE '%admin%')
  )
);

-- Policy 3: Editors can only view user roles
CREATE POLICY \Editors
can
view
user
roles\ 
ON user_roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_list 
    WHERE email = auth.jwt() ->> 'email' 
    AND role ILIKE '%editor%'
  )
);

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
