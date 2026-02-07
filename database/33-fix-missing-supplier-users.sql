-- Fix Missing Supplier Users
-- This script creates user accounts for all suppliers that don't have users
-- Run this if you get "No user found for supplier" errors
--
-- IMPORTANT: Run database/32-create-missing-organizations-for-suppliers.sql first
-- to ensure organizations exist for all suppliers

-- Step 1: Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Diagnostic - Find suppliers (organizations) without users
SELECT 
    '=== DIAGNOSTIC: Suppliers Without Users ===' as info;

SELECT 
    o.id as organization_id,
    o.name as supplier_name,
    o.email as supplier_email,
    COUNT(u.id) as user_count
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
WHERE o.type::text = 'supplier'
GROUP BY o.id, o.name, o.email
HAVING COUNT(u.id) = 0
ORDER BY o.name;

-- Step 3: Create missing user accounts for all suppliers
-- Users are linked to organizations (not tenants)
-- Extract first and last name from supplier name
INSERT INTO users (
    id,
    organization_id,
    email,
    password_hash,
    name,
    type,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    o.id as organization_id,
    o.email,
    crypt('Demo123!', gen_salt('bf', 12)) as password_hash,
    -- Use organization name as user name
    o.name as name,
    'supplier'::"UserType" as type,
    NOW() as created_at,
    NOW() as updated_at
FROM organizations o
WHERE o.type::text = 'supplier'
  AND NOT EXISTS (
      SELECT 1 
      FROM users u 
      WHERE u.organization_id = o.id
  )
ON CONFLICT (email) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    updated_at = NOW();

-- Step 4: Verify all suppliers now have users
SELECT 
    '=== VERIFICATION: Suppliers with Users ===' as info;

SELECT 
    o.name as supplier_name,
    o.email as supplier_email,
    u.email as user_email,
    u.name as user_name,
    u.type as user_type
FROM organizations o
JOIN users u ON o.id = u.organization_id
WHERE o.type::text = 'supplier'
ORDER BY o.name;

-- Step 5: Summary
SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    (SELECT COUNT(*) FROM organizations WHERE type::text = 'supplier') as "Total Supplier Organizations",
    (SELECT COUNT(*) FROM users u 
     JOIN organizations o ON u.organization_id = o.id 
     WHERE o.type::text = 'supplier') as "Suppliers with Users",
    (SELECT COUNT(*) FROM organizations o
     WHERE o.type::text = 'supplier'
       AND NOT EXISTS (SELECT 1 FROM users u WHERE u.organization_id = o.id)) as "Suppliers without Users";
