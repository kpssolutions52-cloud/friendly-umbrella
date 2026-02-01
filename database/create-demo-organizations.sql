-- Create demo organizations and fix demo user accounts
-- This script creates proper supplier and company organizations for demo accounts

-- Step 1: Create demo supplier organization if it doesn't exist
DO $$
DECLARE
    supplier_org_id UUID;
BEGIN
    -- Check if demo supplier org exists, if not create it
    SELECT id INTO supplier_org_id
    FROM organizations
    WHERE email = 'demo-supplier@constructionguru.com';
    
    IF supplier_org_id IS NULL THEN
        INSERT INTO organizations (id, name, type, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Demo Supplier Organization',
            'supplier',
            'demo-supplier@constructionguru.com',
            NOW(),
            NOW()
        )
        RETURNING id INTO supplier_org_id;
        
        RAISE NOTICE 'Created demo supplier organization: %', supplier_org_id;
    ELSE
        RAISE NOTICE 'Demo supplier organization already exists: %', supplier_org_id;
    END IF;
END $$;

-- Step 2: Create demo company organization if it doesn't exist
DO $$
DECLARE
    company_org_id UUID;
BEGIN
    -- Check if demo company org exists, if not create it
    SELECT id INTO company_org_id
    FROM organizations
    WHERE email = 'demo-company@constructionguru.com';
    
    IF company_org_id IS NULL THEN
        INSERT INTO organizations (id, name, type, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Demo Company Organization',
            'company',
            'demo-company@constructionguru.com',
            NOW(),
            NOW()
        )
        RETURNING id INTO company_org_id;
        
        RAISE NOTICE 'Created demo company organization: %', company_org_id;
    ELSE
        RAISE NOTICE 'Demo company organization already exists: %', company_org_id;
    END IF;
END $$;

-- Step 3: Update demo supplier user to use the supplier organization
UPDATE users u
SET 
    organization_id = (
        SELECT id FROM organizations 
        WHERE email = 'demo-supplier@constructionguru.com' 
        LIMIT 1
    ),
    type = 'supplier'::usertype
WHERE u.email = 'demo.supplier@constructionguru.com'
  AND EXISTS (
    SELECT 1 FROM organizations 
    WHERE email = 'demo-supplier@constructionguru.com'
  );

-- Verify the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated % demo supplier user(s)', updated_count;
    ELSE
        RAISE WARNING 'No demo supplier user was updated. User may not exist.';
    END IF;
END $$;

-- Step 4: Update demo QS user to use the company organization
UPDATE users u
SET 
    organization_id = (
        SELECT id FROM organizations 
        WHERE email = 'demo-company@constructionguru.com' 
        LIMIT 1
    ),
    type = 'qs'::usertype
WHERE u.email = 'demo.qs@constructionguru.com'
  AND EXISTS (
    SELECT 1 FROM organizations 
    WHERE email = 'demo-company@constructionguru.com'
  );

-- Verify the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated % demo QS user(s)', updated_count;
    ELSE
        RAISE WARNING 'No demo QS user was updated. User may not exist.';
    END IF;
END $$;

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
