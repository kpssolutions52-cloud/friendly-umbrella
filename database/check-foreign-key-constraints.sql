-- Check foreign key constraints on products table
-- This will help identify why the constraint is failing

-- 1. Check the foreign key constraint definition
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'supplier_id';

-- 2. Check if the demo supplier organization exists and its ID format
SELECT 
    id,
    name,
    type,
    email,
    pg_typeof(id) as id_type,
    length(id::text) as id_length
FROM organizations
WHERE email = 'demo-supplier@constructionguru.com'
   OR name = 'Demo Supplier Organization';

-- 3. Check the demo supplier user and their organization link
SELECT 
    u.id as user_id,
    u.email,
    u.type as user_type,
    u.organization_id,
    o.id as org_id,
    o.name as org_name,
    o.type as org_type,
    CASE 
        WHEN u.organization_id::text = o.id::text THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as id_match
FROM users u
LEFT JOIN organizations o ON u.organization_id::text = o.id::text
WHERE u.email = 'demo.supplier@constructionguru.com';

-- 4. Try to manually insert a test product (this will show the exact error)
-- Uncomment to test:
/*
INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    (SELECT id FROM organizations WHERE email = 'demo-supplier@constructionguru.com' LIMIT 1),
    'Test Product',
    'TEST-001',
    10.00,
    'unit',
    NOW(),
    NOW()
WHERE EXISTS (SELECT 1 FROM organizations WHERE email = 'demo-supplier@constructionguru.com');
*/
