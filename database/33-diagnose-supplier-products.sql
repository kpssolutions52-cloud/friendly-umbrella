-- Diagnostic script to identify why suppliers have no products
-- Run this to understand the data structure and relationships

-- Step 1: Check if products exist at all
SELECT 
    '=== PRODUCTS CHECK ===' as info;

SELECT 
    COUNT(*) as total_products,
    COUNT(DISTINCT supplier_id) as suppliers_with_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM products;

-- Step 2: Check if organizations exist for suppliers
SELECT 
    '=== ORGANIZATIONS CHECK ===' as info;

SELECT 
    COUNT(*) as total_organizations,
    COUNT(CASE WHEN type::text = 'supplier' THEN 1 END) as supplier_organizations
FROM organizations;

-- Step 3: Check if tenants (suppliers) exist
SELECT 
    '=== TENANTS (SUPPLIERS) CHECK ===' as info;

SELECT 
    COUNT(*) as total_supplier_tenants,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_supplier_tenants
FROM tenants
WHERE type = 'supplier';

-- Step 4: Check if organizations match tenants by email
SELECT 
    '=== EMAIL MATCHING CHECK ===' as info;

SELECT 
    COUNT(DISTINCT t.id) as tenants_with_matching_orgs
FROM tenants t
WHERE t.type = 'supplier'
  AND t.status = 'active'
  AND EXISTS (
      SELECT 1 
      FROM organizations o 
      WHERE o.email = t.email 
        AND o.type::text = 'supplier'
  );

-- Step 5: Check if products are linked to organizations
SELECT 
    '=== PRODUCT-ORGANIZATION LINK CHECK ===' as info;

SELECT 
    COUNT(DISTINCT p.supplier_id) as organizations_with_products,
    COUNT(p.id) as total_products_linked
FROM products p
WHERE EXISTS (
    SELECT 1 
    FROM organizations o 
    WHERE o.id = p.supplier_id
);

-- Step 6: Check the full chain: tenants -> organizations -> products
SELECT 
    '=== FULL CHAIN CHECK ===' as info;

SELECT 
    COUNT(DISTINCT t.id) as suppliers_with_complete_chain
FROM tenants t
JOIN organizations o ON t.email = o.email 
    AND (o.type::text = 'supplier' OR o.type = 'supplier'::"OrgType" OR o.type = 'supplier'::org_type)
JOIN products p ON o.id = p.supplier_id
WHERE t.type = 'supplier'
  AND t.status = 'active';

-- Step 7: Sample data - show first 5 suppliers and their product counts
SELECT 
    '=== SAMPLE DATA (First 5 Suppliers) ===' as info;

SELECT 
    t.name as supplier_name,
    t.email as tenant_email,
    o.id as organization_id,
    o.email as organization_email,
    o.type as organization_type,
    COUNT(p.id) as product_count
FROM tenants t
LEFT JOIN organizations o ON t.email = o.email 
    AND o.type::text = 'supplier'
LEFT JOIN products p ON o.id = p.supplier_id
WHERE t.type = 'supplier'
  AND t.status = 'active'
GROUP BY t.id, t.name, t.email, o.id, o.email, o.type
ORDER BY product_count DESC, t.name ASC
LIMIT 5;

-- Step 8: Check for orphaned products (products without matching organizations)
SELECT 
    '=== ORPHANED PRODUCTS CHECK ===' as info;

SELECT 
    COUNT(*) as orphaned_products
FROM products p
WHERE NOT EXISTS (
    SELECT 1 
    FROM organizations o 
    WHERE o.id = p.supplier_id
);

-- Step 9: Check for organizations without matching tenants
SELECT 
    '=== ORGANIZATIONS WITHOUT TENANTS CHECK ===' as info;

SELECT 
    COUNT(*) as orgs_without_tenants
FROM organizations o
WHERE o.type::text = 'supplier'
  AND NOT EXISTS (
      SELECT 1 
      FROM tenants t 
      WHERE t.email = o.email AND t.type = 'supplier'
  );
