-- Fix null UserType values in users table
-- First, create the enum type if it doesn't exist

-- Create the UserType enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usertype') THEN
        CREATE TYPE usertype AS ENUM ('qs', 'supplier');
    END IF;
END $$;

-- First, check how many users have null type
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE type IS NULL) as null_count,
    COUNT(*) FILTER (WHERE type = 'qs') as qs_count,
    COUNT(*) FILTER (WHERE type = 'supplier') as supplier_count
FROM users;

-- Option 1: Set type based on organization type
-- If user belongs to a company organization, set type to 'qs'
-- If user belongs to a supplier organization, set type to 'supplier'
UPDATE users u
SET type = CASE 
    WHEN o.type = 'company' THEN 'qs'
    WHEN o.type = 'supplier' THEN 'supplier'
    ELSE 'qs'  -- Default fallback
END::text
FROM organizations o
WHERE u.organization_id = o.id
AND (u.type IS NULL OR u.type::text NOT IN ('qs', 'supplier'));

-- Cast the text back to the enum type
-- First, let's check if the column is already the right type
-- If not, we may need to alter the column type

-- If the column type is not usertype, we need to convert it
DO $$
BEGIN
    -- Check if column type needs to be changed
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'type'
        AND data_type != 'USER-DEFINED'
    ) THEN
        -- Convert column to enum type
        ALTER TABLE users 
        ALTER COLUMN type TYPE usertype 
        USING type::text::usertype;
    END IF;
END $$;

-- Now update null values (if column is already enum type)
UPDATE users u
SET type = CASE 
    WHEN o.type = 'company' THEN 'qs'::usertype
    WHEN o.type = 'supplier' THEN 'supplier'::usertype
    ELSE 'qs'::usertype
END
FROM organizations o
WHERE u.organization_id = o.id
AND u.type IS NULL;

-- For users with no organization_id, set default
UPDATE users
SET type = 'qs'::usertype
WHERE type IS NULL
AND organization_id IS NOT NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE type = 'qs') as qs_count,
    COUNT(*) FILTER (WHERE type = 'supplier') as supplier_count,
    COUNT(*) FILTER (WHERE type IS NULL) as null_count
FROM users;

-- Show any remaining issues
SELECT id, email, type, organization_id
FROM users
WHERE type IS NULL
LIMIT 10;
