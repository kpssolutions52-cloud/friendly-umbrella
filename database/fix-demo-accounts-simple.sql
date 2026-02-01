-- Simple script to fix demo accounts - handles the "Default Organization" issue
-- Run this if demo accounts are linked to wrong organizations

-- Step 1: Create orgtype enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orgtype') THEN
        CREATE TYPE orgtype AS ENUM ('company', 'supplier');
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

-- Step 4: Create usertype enum if it doesn't exist
DO $$
BEGIN
    -- Check if usertype exists (lowercase)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usertype') THEN
        -- Check if UserType exists (PascalCase)
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserType') THEN
            CREATE TYPE usertype AS ENUM ('qs', 'supplier');
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
