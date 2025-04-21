-- Create user_roles table to manage admin permissions
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS user_roles_email_idx ON user_roles(email);

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);

-- Insert initial super_admin (Brian)
INSERT INTO user_roles (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'briandarrington@btinternet.com'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin';

-- Create RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy for super_admins (can do everything)
CREATE POLICY super_admin_policy ON user_roles
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin'
  ));

-- Policy for admins (can view all roles but only modify non-super_admin roles)
CREATE POLICY admin_read_policy ON user_roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY admin_write_policy ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    ) AND NEW.role != 'super_admin'
  );

CREATE POLICY admin_update_policy ON user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    NEW.role != 'super_admin'
  );

-- Policy for members (can only view their own role)
CREATE POLICY member_read_policy ON user_roles FOR SELECT
  USING (user_id = auth.uid());
