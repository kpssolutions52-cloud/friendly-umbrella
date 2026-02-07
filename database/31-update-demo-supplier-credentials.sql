-- List all suppliers with products for demo login selection
-- This script shows all suppliers that have products, allowing users to select from a list
-- Run this after importing suppliers and products
-- 
-- IMPORTANT: Run database/32-create-missing-organizations-for-suppliers.sql first
-- if you get 0 results, as products are linked to organizations

-- Step 0: Ensure organizations exist (if not already created)
-- Create organizations for suppliers that don't have them
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

-- Step 1: Diagnostic - Check what exists
SELECT 
    '=== DIAGNOSTIC: Checking Database State ===' as info;

SELECT 
    (SELECT COUNT(*) FROM tenants WHERE type = 'supplier' AND status = 'active') as "Active Suppliers",
    (SELECT COUNT(*) FROM organizations WHERE type::text = 'supplier') as "Supplier Organizations",
    (SELECT COUNT(*) FROM products) as "Total Products",
    (SELECT COUNT(*) FROM users WHERE role = 'supplier_admin') as "Supplier Admin Users";

-- Step 2: List all suppliers with products (sorted by product count)
-- If no products exist, this will show all suppliers (with 0 products)
SELECT 
    '=== DEMO SUPPLIERS (Select from this list) ===' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY COALESCE(product_counts.product_count, 0) DESC, t.name ASC) as rank,
    t.name as "Supplier Name",
    u.email as "Login Email",
    'Demo123!' as "Password",
    COALESCE(product_counts.product_count, 0) as "Total Products",
    COALESCE(product_counts.active_products, 0) as "Active Products",
    t.phone as "Phone",
    t.address as "Address",
    t.postal_code as "Postal Code",
    CASE 
        WHEN COALESCE(product_counts.product_count, 0) >= 50 THEN '⭐⭐⭐ Excellent (50+ products)'
        WHEN COALESCE(product_counts.product_count, 0) >= 20 THEN '⭐⭐ Good (20-49 products)'
        WHEN COALESCE(product_counts.product_count, 0) >= 10 THEN '⭐ Fair (10-19 products)'
        WHEN COALESCE(product_counts.product_count, 0) > 0 THEN '📦 Has Products'
        ELSE '📝 No Products Yet (Ready to add products)'
    END as "Recommendation"
FROM tenants t
JOIN users u ON t.id = u.tenant_id
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(p.id)::integer as product_count,
            COUNT(CASE WHEN p.is_active = true THEN 1 END)::integer as active_products
        FROM organizations o
        LEFT JOIN products p ON o.id = p.supplier_id
        WHERE o.email = t.email 
          AND o.type::text = 'supplier'
    ) product_counts ON true
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
ORDER BY COALESCE(product_counts.product_count, 0) DESC, t.name ASC;

-- Step 2: Ensure all suppliers with products have demo password set
-- Update user passwords to Demo123! for all suppliers that have products
UPDATE users
SET password_hash = crypt('Demo123!', gen_salt('bf', 12))
WHERE users.role = 'supplier_admin'
  AND EXISTS (
      SELECT 1 
      FROM tenants t
      JOIN organizations o ON t.email = o.email 
        AND o.type::text = 'supplier'
      JOIN products p ON o.id = p.supplier_id
      WHERE t.id = users.tenant_id
        AND t.type = 'supplier'
        AND t.status = 'active'
        AND users.email = t.email
  );

-- Step 3: Display summary
SELECT 
    '=== SUMMARY ===' as info;

WITH supplier_stats AS (
    SELECT 
        t.id,
        COALESCE(product_counts.product_count, 0)::integer as product_count,
        COALESCE(product_counts.active_products, 0)::integer as active_products
    FROM tenants t
    JOIN users u ON t.id = u.tenant_id
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(p.id)::integer as product_count,
            COUNT(CASE WHEN p.is_active = true THEN 1 END)::integer as active_products
        FROM organizations o
        LEFT JOIN products p ON o.id = p.supplier_id
        WHERE o.email = t.email 
          AND o.type::text = 'supplier'
    ) product_counts ON true
    WHERE t.type = 'supplier' 
      AND t.status = 'active'
      AND u.role = 'supplier_admin'
)
SELECT 
    COUNT(*)::integer as "Total Active Suppliers",
    COUNT(CASE WHEN product_count > 0 THEN 1 END)::integer as "Suppliers with Products",
    COALESCE(SUM(product_count), 0)::integer as "Total Products",
    COALESCE(SUM(active_products), 0)::integer as "Active Products",
    ROUND(AVG(CASE WHEN product_count > 0 THEN product_count END), 2) as "Avg Products per Supplier (with products)",
    COALESCE(MAX(product_count), 0)::integer as "Max Products (Single Supplier)"
FROM supplier_stats;
