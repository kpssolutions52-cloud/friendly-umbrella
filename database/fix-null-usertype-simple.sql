-- SIMPLE VERSION: Fix null UserType values
-- This version assumes the column might be text or enum

-- Step 1: Create enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usertype') THEN
        CREATE TYPE usertype AS ENUM ('qs', 'supplier');
    END IF;
END $$;

-- Step 2: Check current column type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'type';

-- Step 3: If column is text/varchar, convert to enum
DO $$
BEGIN
    -- Check if we need to convert
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'type'
        AND udt_name != 'usertype'
    ) THEN
        -- First, update any invalid values
        UPDATE users SET type = 'qs' WHERE type IS NULL OR type::text NOT IN ('qs', 'supplier');
        
        -- Then convert column type
        ALTER TABLE users 
        ALTER COLUMN type TYPE usertype 
        USING CASE 
            WHEN type::text = 'qs' THEN 'qs'::usertype
            WHEN type::text = 'supplier' THEN 'supplier'::usertype
            ELSE 'qs'::usertype
        END;
    END IF;
END $$;

-- Step 4: Update null values based on organization
UPDATE users u
SET type = CASE 
    WHEN o.type = 'company' THEN 'qs'::usertype
    WHEN o.type = 'supplier' THEN 'supplier'::usertype
    ELSE 'qs'::usertype
END
FROM organizations o
WHERE u.organization_id = o.id
AND u.type IS NULL;

-- Step 5: Set default for any remaining nulls
UPDATE users
SET type = 'qs'::usertype
WHERE type IS NULL;

-- Step 6: Verify
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE type = 'qs') as qs,
    COUNT(*) FILTER (WHERE type = 'supplier') as supplier,
    COUNT(*) FILTER (WHERE type IS NULL) as nulls
FROM users;
