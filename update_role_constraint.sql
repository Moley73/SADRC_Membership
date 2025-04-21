-- SQL script to update the role constraint in the admin_list table
-- This modifies the constraint to allow the 'editor' role

-- First, let's check the current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'admin_list'::regclass AND conname = 'admin_list_role_check';

-- Drop the existing constraint
ALTER TABLE admin_list DROP CONSTRAINT IF EXISTS admin_list_role_check;

-- Create a new constraint that includes the 'editor' role
ALTER TABLE admin_list ADD CONSTRAINT admin_list_role_check 
CHECK (role IN ('admin', 'super_admin', 'editor'));

-- Verify the updated constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'admin_list'::regclass AND conname = 'admin_list_role_check';
