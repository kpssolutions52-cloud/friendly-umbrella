-- Simple script to fix demo accounts - handles the "Default Organization" issue
-- Run this if demo accounts are linked to wrong organizations

-- Step 1: Create OrgType enum if it doesn't exist (PascalCase for Prisma compatibility)
DO $$
BEGIN
    -- Check if OrgType (PascalCase) exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgType') THEN
        -- Check if orgtype (lowercase) exists and migrate it
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orgtype') THEN
            -- Create the new OrgType enum
            CREATE TYPE "OrgType" AS ENUM ('company', 'supplier');
            -- Update organizations table to use new type
            ALTER TABLE organizations 
            ALTER COLUMN type TYPE "OrgType" 
            USING type::text::"OrgType";
            -- Drop old enum if no other tables use it
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE udt_name = 'orgtype' AND table_name != 'organizations'
            ) THEN
                DROP TYPE orgtype;
            END IF;
        ELSE
            -- Neither exists - create OrgType
            CREATE TYPE "OrgType" AS ENUM ('company', 'supplier');
        END IF;
    END IF;
END $$;

-- Step 2: Get or create demo supplier organization
INSERT INTO organizations (id, name, type, email, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Demo Supplier Organization',
    'supplier',
    'demo-supplier@constructionguru.com',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM organizations 
    WHERE email = 'demo-supplier@constructionguru.com'
);

-- Step 3: Get or create demo company organization
INSERT INTO organizations (id, name, type, email, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Demo Company Organization',
    'company',
    'demo-company@constructionguru.com',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM organizations 
    WHERE email = 'demo-company@constructionguru.com'
);

-- Step 4: Create UserType enum if it doesn't exist (PascalCase for Prisma compatibility)
DO $$
BEGIN
    -- Check if UserType (PascalCase) exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserType') THEN
        -- Check if usertype (lowercase) exists and migrate it
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usertype') THEN
            -- Create the new UserType enum
            CREATE TYPE "UserType" AS ENUM ('qs', 'supplier');
            -- Update users table to use new type
            ALTER TABLE users 
            ALTER COLUMN type TYPE "UserType" 
            USING type::text::"UserType";
            -- Drop old enum if no other tables use it
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE udt_name = 'usertype' AND table_name != 'users'
            ) THEN
                DROP TYPE usertype;
            END IF;
        ELSE
            -- Neither exists - create UserType
            CREATE TYPE "UserType" AS ENUM ('qs', 'supplier');
        END IF;
    END IF;
END $$;

-- Step 5: Fix demo supplier user - link to supplier organization
UPDATE users
SET 
    organization_id = (SELECT id FROM organizations WHERE email = 'demo-supplier@constructionguru.com' LIMIT 1),
    type = 'supplier'
WHERE email = 'demo.supplier@constructionguru.com'
  AND (SELECT id FROM organizations WHERE email = 'demo-supplier@constructionguru.com' LIMIT 1) IS NOT NULL;

-- Step 6: Fix demo QS user - link to company organization
UPDATE users
SET 
    organization_id = (SELECT id FROM organizations WHERE email = 'demo-company@constructionguru.com' LIMIT 1),
    type = 'qs'
WHERE email = 'demo.qs@constructionguru.com'
  AND (SELECT id FROM organizations WHERE email = 'demo-company@constructionguru.com' LIMIT 1) IS NOT NULL;

-- Step 7: Show results
SELECT 
    u.email,
    u.type as user_type,
    o.name as organization_name,
    o.type as organization_type,
    o.id as organization_id,
    CASE 
        WHEN u.type = 'supplier' AND o.type = 'supplier' THEN '✅ CORRECT'
        WHEN u.type = 'qs' AND o.type = 'company' THEN '✅ CORRECT'
        ELSE '❌ MISMATCH'
    END as status
FROM users u
LEFT JOIN organizations o ON u.organization_id::text = o.id::text
WHERE u.email IN ('demo.supplier@constructionguru.com', 'demo.qs@constructionguru.com')
ORDER BY u.email;
