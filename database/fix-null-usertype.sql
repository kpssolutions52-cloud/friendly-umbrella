-- Fix null UserType values in users table
-- The UserType enum only allows 'qs' or 'supplier', so null values need to be fixed

-- First, check how many users have null type
SELECT 
    COUNT(*) as null_type_count,
    COUNT(*) FILTER (WHERE type IS NULL) as null_count,
    COUNT(*) FILTER (WHERE type = 'qs') as qs_count,
    COUNT(*) FILTER (WHERE type = 'supplier') as supplier_count
FROM users;

-- Option 1: Set default type based on organization type
-- If user belongs to a company organization, set type to 'qs'
-- If user belongs to a supplier organization, set type to 'supplier'
UPDATE users u
SET type = CASE 
    WHEN o.type = 'company' THEN 'qs'::usertype
    WHEN o.type = 'supplier' THEN 'supplier'::usertype
    ELSE 'qs'::usertype  -- Default fallback
END
FROM organizations o
WHERE u.organization_id = o.id
AND u.type IS NULL;

-- Option 2: If user has no organization or organization type is unclear,
-- set a default type (you may want to adjust this based on your needs)
UPDATE users
SET type = 'qs'::usertype
WHERE type IS NULL
AND organization_id IS NOT NULL;

-- For users with no organization_id, you may need to handle separately
-- or delete them if they're invalid
-- UPDATE users
-- SET type = 'qs'::usertype
-- WHERE type IS NULL
-- AND organization_id IS NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE type = 'qs') as qs_count,
    COUNT(*) FILTER (WHERE type = 'supplier') as supplier_count,
    COUNT(*) FILTER (WHERE type IS NULL) as null_count
FROM users;

-- If there are still null values, you may need to manually set them
-- or delete invalid users:
-- DELETE FROM users WHERE type IS NULL;
