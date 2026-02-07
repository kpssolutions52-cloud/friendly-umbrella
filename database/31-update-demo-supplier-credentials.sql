-- List all suppliers with products for demo login selection
-- This script shows all suppliers that have products, allowing users to select from a list
-- Run this after importing suppliers and products

-- Step 1: List all suppliers with products (sorted by product count)
SELECT 
    '=== DEMO SUPPLIERS WITH PRODUCTS (Select from this list) ===' as info;

SELECT 
    ROW_NUMBER() OVER (ORDER BY COUNT(p.id) DESC, COUNT(CASE WHEN p.is_active = true THEN 1 END) DESC) as rank,
    t.name as "Supplier Name",
    u.email as "Login Email",
    'Demo123!' as "Password",
    COUNT(p.id) as "Total Products",
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as "Active Products",
    t.phone as "Phone",
    t.address as "Address",
    t.postal_code as "Postal Code",
    CASE 
        WHEN COUNT(p.id) >= 50 THEN '⭐⭐⭐ Excellent (50+ products)'
        WHEN COUNT(p.id) >= 20 THEN '⭐⭐ Good (20-49 products)'
        WHEN COUNT(p.id) >= 10 THEN '⭐ Fair (10-19 products)'
        ELSE '📦 Has Products'
    END as "Recommendation"
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
GROUP BY t.id, t.name, t.email, u.email, t.phone, t.address, t.postal_code
HAVING COUNT(p.id) > 0
ORDER BY COUNT(p.id) DESC, COUNT(CASE WHEN p.is_active = true THEN 1 END) DESC, t.name ASC;

-- Step 2: Ensure all suppliers with products have demo password set
-- Update user passwords to Demo123! for all suppliers that have products
UPDATE users
SET password_hash = crypt('Demo123!', gen_salt('bf', 12))
WHERE users.role = 'supplier_admin'
  AND EXISTS (
      SELECT 1 
      FROM tenants t
      JOIN organizations o ON t.email = o.email AND o.type = 'supplier'
      JOIN products p ON o.id = p.supplier_id
      WHERE t.id = users.tenant_id
        AND t.type = 'supplier'
        AND t.status = 'active'
        AND users.email = t.email
  );

-- Step 3: Display summary
SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    COUNT(DISTINCT t.id) as "Suppliers with Products",
    COUNT(p.id) as "Total Products",
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as "Active Products",
    ROUND(AVG(product_counts.product_count), 2) as "Avg Products per Supplier",
    MAX(product_counts.product_count) as "Max Products (Single Supplier)"
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
