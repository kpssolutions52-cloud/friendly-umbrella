-- Link existing products to supplier organizations
-- This script helps connect products that may exist but aren't linked to suppliers
-- 
-- IMPORTANT: Products must be linked to organizations (not tenants)
-- The relationship is: tenants -> organizations (by email) -> products (by organization.id)

-- Step 1: Check current state
SELECT 
    '=== CURRENT STATE ===' as info;

SELECT 
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(DISTINCT supplier_id) FROM products) as products_with_supplier_id,
    (SELECT COUNT(*) FROM organizations WHERE type::text = 'supplier') as supplier_organizations,
    (SELECT COUNT(*) FROM tenants WHERE type = 'supplier' AND status = 'active') as active_suppliers;

-- Step 2: Check for orphaned products (products without valid organization)
SELECT 
    '=== ORPHANED PRODUCTS ===' as info;

SELECT 
    p.id,
    p.name,
    p.supplier_id,
    CASE 
        WHEN o.id IS NULL THEN '❌ No organization found'
        WHEN o.type::text != 'supplier' THEN '❌ Organization is not a supplier'
        ELSE '✅ Valid'
    END as status
FROM products p
LEFT JOIN organizations o ON p.supplier_id = o.id
WHERE o.id IS NULL OR o.type::text != 'supplier'
LIMIT 10;

-- Step 3: Check for products that could be linked to suppliers
-- (This assumes products might have supplier_id pointing to wrong table or NULL)
SELECT 
    '=== PRODUCTS THAT NEED LINKING ===' as info;

-- If products have supplier_id but it doesn't match any organization
SELECT 
    COUNT(*) as products_with_invalid_supplier_id
FROM products p
WHERE NOT EXISTS (
    SELECT 1 
    FROM organizations o 
    WHERE o.id = p.supplier_id AND o.type::text = 'supplier'
);

-- Step 4: Show sample of products and their current supplier links
SELECT 
    '=== SAMPLE PRODUCTS AND THEIR SUPPLIERS ===' as info;

SELECT 
    p.id as product_id,
    p.name as product_name,
    p.supplier_id,
    o.id as organization_id,
    o.name as organization_name,
    o.email as organization_email,
    o.type as organization_type,
    t.id as tenant_id,
    t.name as tenant_name,
    t.email as tenant_email
FROM products p
LEFT JOIN organizations o ON p.supplier_id = o.id
LEFT JOIN tenants t ON o.email = t.email AND t.type = 'supplier'
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 5: Instructions for manual linking
SELECT 
    '=== INSTRUCTIONS ===' as info;

SELECT 
    'To link products to suppliers:' as instruction,
    '1. Products must have supplier_id pointing to organizations.id' as step1,
    '2. Organizations must have type = supplier' as step2,
    '3. Organizations.email must match tenants.email' as step3,
    '4. Tenants must have type = supplier and status = active' as step4;

-- Step 6: If you have a catalog with products, you may need to:
-- Option A: Create products from catalog and link them to suppliers
-- Option B: Update existing products to point to correct supplier organizations
-- 
-- To create products for suppliers, you would need to:
-- 1. Identify which supplier should have which products
-- 2. Get the organization.id for that supplier (from organizations table where email matches tenant email)
-- 3. Insert products with that organization.id as supplier_id
--
-- Example query to get organization IDs for suppliers:
SELECT 
    '=== SUPPLIER ORGANIZATION IDs (for reference) ===' as info;

SELECT 
    t.name as supplier_name,
    t.email as supplier_email,
    o.id as organization_id,
    COUNT(p.id) as current_product_count
FROM tenants t
LEFT JOIN organizations o ON t.email = o.email AND o.type::text = 'supplier'
LEFT JOIN products p ON o.id = p.supplier_id
WHERE t.type = 'supplier'
  AND t.status = 'active'
GROUP BY t.id, t.name, t.email, o.id
ORDER BY current_product_count DESC, t.name ASC
LIMIT 20;
