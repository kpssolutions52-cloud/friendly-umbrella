-- Add 'name' column to users table
-- This column is optional (nullable) to match the Prisma schema

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.name IS 'User full name (optional)';

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'name';
