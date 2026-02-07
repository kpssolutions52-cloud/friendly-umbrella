-- Create products from catalog items and distribute them across suppliers
-- This script:
-- 1. Takes catalog items
-- 2. Creates products from them
-- 3. Distributes products across active suppliers
-- 4. Links products to supplier organizations
--
-- IMPORTANT: Run this after:
-- - database/32-create-missing-organizations-for-suppliers.sql (to ensure organizations exist)
-- - database/28-load-catalog-inserts.sql (to ensure catalog items exist)

-- Step 1: Check prerequisites
SELECT 
    '=== PREREQUISITES CHECK ===' as info;

SELECT 
    (SELECT COUNT(*) FROM catalog_items WHERE is_active = true) as "Catalog Items Available",
    (SELECT COUNT(*) FROM organizations WHERE type::text = 'supplier') as "Supplier Organizations",
    (SELECT COUNT(*) FROM tenants WHERE type = 'supplier' AND status = 'active') as "Active Suppliers",
    (SELECT COUNT(*) FROM products) as "Existing Products";

-- Step 2: Create products from catalog items
-- Distribute products across suppliers (each supplier gets a random subset of catalog items)
-- Each catalog item will be converted to a product for 1-3 random suppliers
SELECT 
    '=== CREATING PRODUCTS FROM CATALOG ===' as info;

-- Create products from catalog items, distributed across suppliers
-- Strategy: Each catalog item becomes a product for 1-3 random suppliers
WITH supplier_orgs AS (
    SELECT 
        o.id as org_id,
        o.name as org_name,
        o.email as org_email,
        t.id as tenant_id,
        ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
    FROM organizations o
    JOIN tenants t ON o.email = t.email
    WHERE o.type::text = 'supplier'
      AND t.type = 'supplier'
      AND t.status = 'active'
),
catalog_with_suppliers AS (
    SELECT 
        ci.id as catalog_item_id,
        ci.name,
        ci.unit_code,
        ci.category_id,
        ci.description,
        so.org_id as supplier_id,
        -- Generate SKU: first 3 letters of supplier name + catalog item code or name
        UPPER(SUBSTRING(REPLACE(so.org_name, ' ', ''), 1, 3)) || '-' || 
        COALESCE(ci.code, UPPER(SUBSTRING(REPLACE(ci.name, ' ', ''), 1, 8))) || '-' ||
        LPAD((ROW_NUMBER() OVER (PARTITION BY so.org_id ORDER BY ci.name))::text, 4, '0') as sku,
        -- Random price between 10 and 1000 (for demo purposes)
        (10 + (RANDOM() * 990))::numeric(12,2) as price
    FROM catalog_items ci
    CROSS JOIN LATERAL (
        -- Each catalog item goes to 1-3 random suppliers
        SELECT so.org_id, so.org_name
        FROM supplier_orgs so
        ORDER BY RANDOM()
        LIMIT (1 + FLOOR(RANDOM() * 3)::int)
    ) so
    WHERE ci.is_active = true
    AND ci.id NOT IN (
        -- Avoid duplicates: skip if product already exists for this supplier
        SELECT p.catalog_item_id
        FROM products p
        WHERE p.supplier_id = so.org_id
          AND p.catalog_item_id IS NOT NULL
    )
)
INSERT INTO products (
    id,
    supplier_id,
    name,
    sku,
    price,
    unit,
    stock_availability,
    is_active,
    catalog_item_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    supplier_id,
    name,
    sku,
    price,
    unit_code,
    'in_stock' as stock_availability,
    true as is_active,
    catalog_item_id,
    NOW(),
    NOW()
FROM catalog_with_suppliers
ON CONFLICT (supplier_id, sku) DO NOTHING;

-- Step 3: Show summary of created products
SELECT 
    '=== PRODUCTS CREATED ===' as info;

SELECT 
    COUNT(*) as "Total Products Created",
    COUNT(DISTINCT supplier_id) as "Suppliers with Products",
    COUNT(DISTINCT catalog_item_id) as "Unique Catalog Items Used",
    AVG(price)::numeric(10,2) as "Average Price",
    MIN(price)::numeric(10,2) as "Min Price",
    MAX(price)::numeric(10,2) as "Max Price"
FROM products
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Step 4: Show distribution across suppliers
SELECT 
    '=== PRODUCT DISTRIBUTION BY SUPPLIER ===' as info;

SELECT 
    t.name as "Supplier Name",
    t.email as "Email",
    COUNT(p.id) as "Product Count",
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as "Active Products"
FROM tenants t
JOIN organizations o ON t.email = o.email AND o.type::text = 'supplier'
LEFT JOIN products p ON o.id = p.supplier_id
WHERE t.type = 'supplier'
  AND t.status = 'active'
GROUP BY t.id, t.name, t.email
ORDER BY COUNT(p.id) DESC, t.name ASC
LIMIT 20;

-- Step 5: Final summary
SELECT 
    '=== FINAL SUMMARY ===' as info;

SELECT 
    (SELECT COUNT(*) FROM products) as "Total Products",
    (SELECT COUNT(DISTINCT supplier_id) FROM products) as "Suppliers with Products",
    (SELECT COUNT(*) FROM tenants WHERE type = 'supplier' AND status = 'active') as "Total Active Suppliers",
    ROUND(
        (SELECT COUNT(DISTINCT supplier_id)::numeric FROM products) / 
        NULLIF((SELECT COUNT(*)::numeric FROM tenants WHERE type = 'supplier' AND status = 'active'), 0) * 100, 
        2
    ) as "Percentage of Suppliers with Products";
