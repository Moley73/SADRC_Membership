-- SQL script to update the admin_list table schema
-- This adds a name column if it doesn't exist

-- First check if the name column exists
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'admin_list'
        AND column_name = 'name'
    ) INTO column_exists;

    -- Add the name column if it doesn't exist
    IF NOT column_exists THEN
        ALTER TABLE admin_list ADD COLUMN name TEXT;
        
        -- Update existing records to set name based on email
        UPDATE admin_list
        SET name = SPLIT_PART(email, '@', 1)
        WHERE name IS NULL;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_list';
