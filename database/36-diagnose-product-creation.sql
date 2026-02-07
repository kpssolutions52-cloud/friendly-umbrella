-- Diagnose why products weren't created from catalog
-- Run this to understand what's missing

-- Step 1: Check if catalog items exist
SELECT 
    '=== CATALOG ITEMS CHECK ===' as info;

SELECT 
    COUNT(*) as total_catalog_items,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_catalog_items,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_catalog_items
FROM catalog_items;

-- Step 2: Check if products exist
SELECT 
    '=== PRODUCTS CHECK ===' as info;

SELECT 
    COUNT(*) as total_products,
    COUNT(DISTINCT supplier_id) as suppliers_with_products,
    COUNT(CASE WHEN catalog_item_id IS NOT NULL THEN 1 END) as products_from_catalog,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM products;

-- Step 3: Check supplier organizations
SELECT 
    '=== SUPPLIER ORGANIZATIONS CHECK ===' as info;

SELECT 
    COUNT(*) as total_supplier_orgs,
    COUNT(DISTINCT o.email) as unique_emails
FROM organizations o
WHERE o.type::text = 'supplier';

-- Step 4: Check the link between tenants and organizations
SELECT 
    '=== TENANT-ORGANIZATION LINK CHECK ===' as info;

SELECT 
    COUNT(*) as tenants_with_matching_orgs
FROM tenants t
WHERE t.type = 'supplier'
  AND t.status = 'active'
  AND EXISTS (
      SELECT 1 
      FROM organizations o 
      WHERE o.email = t.email 
        AND o.type::text = 'supplier'
  );

-- Step 5: Sample catalog items (first 10)
SELECT 
    '=== SAMPLE CATALOG ITEMS ===' as info;

SELECT 
    id,
    name,
    unit_code,
    code,
    is_active
FROM catalog_items
WHERE is_active = true
ORDER BY name
LIMIT 10;

-- Step 6: Sample supplier organizations (first 10)
SELECT 
    '=== SAMPLE SUPPLIER ORGANIZATIONS ===' as info;

SELECT 
    o.id as org_id,
    o.name as org_name,
    o.email as org_email,
    o.type as org_type,
    t.id as tenant_id,
    t.name as tenant_name,
    t.status as tenant_status
FROM organizations o
LEFT JOIN tenants t ON o.email = t.email AND t.type = 'supplier'
WHERE o.type::text = 'supplier'
ORDER BY o.name
LIMIT 10;

-- Step 7: Check if products table has the required columns
SELECT 
    '=== PRODUCTS TABLE SCHEMA CHECK ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('id', 'supplier_id', 'name', 'sku', 'price', 'unit', 'catalog_item_id', 'stock_availability', 'is_active')
ORDER BY ordinal_position;

-- Step 8: Try a simple test insert (commented out - uncomment to test)
-- This will help identify if there's a constraint or data type issue
/*
SELECT 
    '=== TEST INSERT (Check if this works) ===' as info;

-- Get first supplier org and first catalog item
WITH test_data AS (
    SELECT 
        o.id as test_org_id,
        ci.id as test_catalog_id,
        ci.name as test_name,
        ci.unit_code as test_unit
    FROM organizations o
    CROSS JOIN catalog_items ci
    WHERE o.type::text = 'supplier'
      AND ci.is_active = true
    LIMIT 1
)
SELECT 
    test_org_id,
    test_catalog_id,
    test_name,
    test_unit,
    'Test-SKU-001' as test_sku,
    100.00 as test_price
FROM test_data;
*/
