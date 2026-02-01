-- Create demo organizations and fix demo user accounts
-- This script creates proper supplier and company organizations for demo accounts

-- Step 1: Create demo supplier organization if it doesn't exist
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
)
RETURNING id;

-- Step 2: Create demo company organization if it doesn't exist
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
)
RETURNING id;

-- Step 3: Update demo supplier user to use the supplier organization
UPDATE users u
SET organization_id = (
    SELECT id FROM organizations 
    WHERE email = 'demo-supplier@constructionguru.com' 
    LIMIT 1
),
type = 'supplier'
WHERE u.email = 'demo.supplier@constructionguru.com'
  AND EXISTS (
    SELECT 1 FROM organizations 
    WHERE email = 'demo-supplier@constructionguru.com'
  );

-- Step 4: Update demo QS user to use the company organization
UPDATE users u
SET organization_id = (
    SELECT id FROM organizations 
    WHERE email = 'demo-company@constructionguru.com' 
    LIMIT 1
),
type = 'qs'
WHERE u.email = 'demo.qs@constructionguru.com'
  AND EXISTS (
    SELECT 1 FROM organizations 
    WHERE email = 'demo-company@constructionguru.com'
  );

-- Step 5: Verify the updates
SELECT 
    u.email,
    u.type as user_type,
    o.name as organization_name,
    o.type as organization_type,
    CASE 
        WHEN u.type = 'supplier' AND o.type = 'supplier' THEN '✅ CORRECT'
        WHEN u.type = 'qs' AND o.type = 'company' THEN '✅ CORRECT'
        ELSE '❌ MISMATCH'
    END as status
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email IN ('demo.supplier@constructionguru.com', 'demo.qs@constructionguru.com')
ORDER BY u.email;
