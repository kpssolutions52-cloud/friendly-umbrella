-- List all suppliers with products for demo login selection
-- This query returns all suppliers that have products, sorted by product count
-- Note: Products are linked to organizations, so we join through organizations using email
--
-- IMPORTANT: If you get 0 results, run database/32-create-missing-organizations-for-suppliers.sql first
-- to create organizations for all suppliers

-- Step 0: Ensure organizations exist for all suppliers
-- Handle both OrgType (Prisma) and org_type (legacy) enum types
DO $$
BEGIN
    -- Try with OrgType first (Prisma standard)
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgType') THEN
        INSERT INTO organizations (id, name, type, email, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            t.name,
            'supplier'::"OrgType",
            t.email,
            COALESCE(t.created_at, NOW()),
            COALESCE(t.updated_at, NOW())
        FROM tenants t
        WHERE t.type = 'supplier'
          AND t.status = 'active'
          AND NOT EXISTS (
              SELECT 1 
              FROM organizations o 
              WHERE o.email = t.email AND o.type = 'supplier'::"OrgType"
          )
        ON CONFLICT (email) DO NOTHING;
    -- Fallback to org_type if OrgType doesn't exist
    ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_type') THEN
        INSERT INTO organizations (id, name, type, email, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            t.name,
            'supplier'::org_type,
            t.email,
            COALESCE(t.created_at, NOW()),
            COALESCE(t.updated_at, NOW())
        FROM tenants t
        WHERE t.type = 'supplier'
          AND t.status = 'active'
          AND NOT EXISTS (
              SELECT 1 
              FROM organizations o 
              WHERE o.email = t.email AND o.type = 'supplier'::org_type
          )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

SELECT 
    '=== DEMO SUPPLIERS WITH PRODUCTS (Select from this list) ===' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY COUNT(p.id) DESC, COUNT(CASE WHEN p.is_active = true THEN 1 END) DESC) as rank,
    t.name as supplier_name,
    u.email as login_email,
    'Demo123!' as demo_password,
    COUNT(p.id) as total_products,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products,
    t.phone,
    t.address,
    t.postal_code,
    t.metadata->>'workhead' as bca_workhead,
    t.metadata->>'grade' as bca_grade,
    CASE 
        WHEN COUNT(p.id) >= 50 THEN '⭐⭐⭐ Excellent (50+ products)'
        WHEN COUNT(p.id) >= 20 THEN '⭐⭐ Good (20-49 products)'
        WHEN COUNT(p.id) >= 10 THEN '⭐ Fair (10-19 products)'
        ELSE '📦 Has Products (' || COUNT(p.id)::text || ' products)'
    END as recommendation
FROM tenants t
JOIN users u ON t.id = u.tenant_id
LEFT JOIN organizations o ON t.email = o.email AND o.type = 'supplier'
LEFT JOIN products p ON o.id = p.supplier_id
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
  AND EXISTS (
      SELECT 1 
      FROM organizations org
      JOIN products prod ON org.id = prod.supplier_id
      WHERE org.email = t.email AND org.type = 'supplier'
  )
GROUP BY t.id, t.name, t.email, u.email, t.phone, t.address, t.postal_code, t.metadata
HAVING COUNT(p.id) > 0
ORDER BY total_products DESC, active_products DESC, t.name ASC;

-- Summary: Count of suppliers with products
SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    COUNT(DISTINCT t.id) as suppliers_with_products,
    SUM(product_counts.product_count) as total_products_across_all_suppliers,
    AVG(product_counts.product_count) as avg_products_per_supplier,
    MAX(product_counts.product_count) as max_products_single_supplier
FROM tenants t
JOIN users u ON t.id = u.tenant_id
LEFT JOIN organizations o ON t.email = o.email AND o.type = 'supplier'
LEFT JOIN products p ON o.id = p.supplier_id
CROSS JOIN LATERAL (
    SELECT COUNT(p2.id) as product_count
    FROM organizations o2
    JOIN products p2 ON o2.id = p2.supplier_id
    WHERE o2.email = t.email AND o2.type = 'supplier'
) product_counts
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
  AND product_counts.product_count > 0;
