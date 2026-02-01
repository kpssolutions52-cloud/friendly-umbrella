-- Diagnostic query to find organization-related issues
-- Run this to identify users with invalid organizationIds

-- 1. Check users with null or invalid organizationIds
SELECT 
    u.id as user_id,
    u.email,
    u.type as user_type,
    u.organization_id,
    o.id as org_id,
    o.name as org_name,
    o.type as org_type,
    CASE 
        WHEN u.organization_id IS NULL THEN 'MISSING_ORG_ID'
        WHEN o.id IS NULL THEN 'ORG_NOT_FOUND'
        WHEN u.type = 'supplier' AND o.type != 'supplier' THEN 'TYPE_MISMATCH'
        WHEN u.type = 'qs' AND o.type != 'company' THEN 'TYPE_MISMATCH'
        ELSE 'OK'
    END as status
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE 
    u.organization_id IS NULL 
    OR o.id IS NULL
    OR (u.type = 'supplier' AND o.type != 'supplier')
    OR (u.type = 'qs' AND o.type != 'company')
ORDER BY status, u.email;

-- 2. Check all supplier users and their organizations
SELECT 
    u.id as user_id,
    u.email,
    u.type as user_type,
    u.organization_id,
    o.id as org_id,
    o.name as org_name,
    o.type as org_type,
    CASE 
        WHEN o.id IS NULL THEN 'ORG_NOT_FOUND'
        WHEN o.type != 'supplier' THEN 'NOT_SUPPLIER_ORG'
        ELSE 'OK'
    END as status
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.type = 'supplier'
ORDER BY status, u.email;

-- 3. Count organizations by type
SELECT 
    type,
    COUNT(*) as count
FROM organizations
GROUP BY type;

-- 4. Check for orphaned products (products with invalid supplierIds)
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.supplier_id,
    o.id as org_id,
    o.name as org_name,
    o.type as org_type,
    CASE 
        WHEN o.id IS NULL THEN 'SUPPLIER_NOT_FOUND'
        WHEN o.type != 'supplier' THEN 'NOT_SUPPLIER_ORG'
        ELSE 'OK'
    END as status
FROM products p
LEFT JOIN organizations o ON p.supplier_id = o.id
WHERE o.id IS NULL OR o.type != 'supplier'
ORDER BY status, p.name;
