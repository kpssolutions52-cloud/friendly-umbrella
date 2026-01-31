-- SIMPLE VERSION: Fix null UserType values
-- This version assumes the column is already enum type

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

-- Step 3: Update null values based on organization (with proper enum casting)
UPDATE users u
SET type = CASE 
    WHEN o.type = 'company' THEN 'qs'::usertype
    WHEN o.type = 'supplier' THEN 'supplier'::usertype
    ELSE 'qs'::usertype
END
FROM organizations o
WHERE u.organization_id = o.id
AND u.type IS NULL;

-- Step 4: Set default for any remaining nulls
UPDATE users
SET type = 'qs'::usertype
WHERE type IS NULL;

-- Step 5: Verify
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE type = 'qs') as qs,
    COUNT(*) FILTER (WHERE type = 'supplier') as supplier,
    COUNT(*) FILTER (WHERE type IS NULL) as nulls
FROM users;
