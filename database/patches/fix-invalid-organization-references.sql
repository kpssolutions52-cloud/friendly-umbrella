-- Fix invalid organization references
-- WARNING: Review the diagnostic query results before running this!

-- Option 1: Delete users with invalid organizationIds (if they're test/demo accounts)
-- Uncomment and modify as needed:
/*
DELETE FROM users 
WHERE organization_id IS NULL 
   OR organization_id::text NOT IN (SELECT id::text FROM organizations);
*/

-- Option 2: Assign users to a default organization if their org is missing
-- First, create a default supplier organization if it doesn't exist:
INSERT INTO organizations (id, name, type, email, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Default Supplier Organization',
    'supplier',
    'default-supplier@constructionguru.com',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM organizations 
    WHERE email = 'default-supplier@constructionguru.com'
)
RETURNING id;

-- Then update users with null or invalid organizationIds to use the default:
-- (Replace 'YOUR_DEFAULT_SUPPLIER_ORG_ID' with the actual ID from above)
/*
UPDATE users u
SET organization_id = (
    SELECT id FROM organizations 
    WHERE email = 'default-supplier@constructionguru.com' 
    LIMIT 1
)
WHERE u.type = 'supplier'
  AND (
    u.organization_id IS NULL 
    OR u.organization_id::text NOT IN (SELECT id::text FROM organizations)
  );
*/

-- Option 3: Fix organization type mismatches
-- If a supplier user is linked to a company organization, we need to either:
-- A) Change the organization type (if it should be supplier)
-- B) Change the user type (if they should be QS)
-- C) Link them to the correct organization

-- Example: Fix supplier users linked to company organizations
-- (This creates a new supplier org for them - adjust as needed)
/*
-- First, create supplier organizations for users who are suppliers but linked to companies
INSERT INTO organizations (id, name, type, email, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    u.email || ' Supplier Organization',
    'supplier',
    u.email || '@supplier.constructionguru.com',
    NOW(),
    NOW()
FROM users u
LEFT JOIN organizations o ON u.organization_id::text = o.id::text
WHERE u.type = 'supplier' 
  AND (o.type != 'supplier' OR o.id IS NULL)
ON CONFLICT (email) DO NOTHING;

-- Then update users to point to their new supplier organization
UPDATE users u
SET organization_id = (
    SELECT id FROM organizations 
    WHERE email = u.email || '@supplier.constructionguru.com'
    LIMIT 1
)
WHERE u.type = 'supplier'
  AND EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.email = u.email || '@supplier.constructionguru.com'
  )
  AND (
    u.organization_id IS NULL 
    OR u.organization_id::text NOT IN (
        SELECT id::text FROM organizations WHERE type = 'supplier'
    )
  );
*/

-- Option 4: Delete orphaned products (products with invalid supplierIds)
-- Uncomment if you want to clean up orphaned products:
/*
DELETE FROM products 
WHERE supplier_id IS NULL 
   OR supplier_id::text NOT IN (SELECT id::text FROM organizations WHERE type = 'supplier');
*/

-- IMPORTANT: Always backup your database before running any of these queries!
