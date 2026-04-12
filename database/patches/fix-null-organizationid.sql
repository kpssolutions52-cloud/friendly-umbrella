-- Fix null organizationId values in users table
-- organizationId is required (non-nullable) in the new schema

-- Step 1: Check how many users have null organizationId
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE organization_id IS NULL) as null_org_count,
    COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as has_org_count
FROM users;

-- Step 2: Show users with null organizationId
SELECT id, email, type, organization_id, created_at
FROM users
WHERE organization_id IS NULL
LIMIT 20;

-- Step 3: Option 1 - Delete users with null organizationId (if they're invalid)
-- Uncomment if you want to delete invalid users:
-- DELETE FROM users WHERE organization_id IS NULL;

-- Step 3: Option 2 - Create a default organization and assign users to it
-- This is safer if you want to keep the users
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Check if default organization exists, if not create it
    SELECT id INTO default_org_id
    FROM organizations
    WHERE email = 'system@default.org'
    LIMIT 1;
    
    IF default_org_id IS NULL THEN
        -- Create default organization
        INSERT INTO organizations (id, name, type, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Default Organization',
            'company',
            'system@default.org',
            NOW(),
            NOW()
        )
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Assign users with null organizationId to default organization
    UPDATE users
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    RAISE NOTICE 'Assigned % users to default organization', (SELECT COUNT(*) FROM users WHERE organization_id = default_org_id);
END $$;

-- Step 4: Verify the fix
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE organization_id IS NULL) as null_org_count,
    COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as has_org_count
FROM users;

-- Step 5: Show any remaining issues
SELECT u.id, u.email, u.type, u.organization_id, o.name as org_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.organization_id IS NULL
LIMIT 10;
