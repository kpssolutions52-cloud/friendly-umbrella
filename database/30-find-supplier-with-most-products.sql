-- Find supplier with maximum product count for demo login
-- This query identifies which supplier has the most products

SELECT 
    t.id as supplier_id,
    t.name as supplier_name,
    t.email as supplier_email,
    u.email as login_email,
    'Demo123!' as demo_password,
    COUNT(p.id) as product_count,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products,
    t.phone,
    t.address,
    t.postal_code
FROM tenants t
JOIN users u ON t.id = u.tenant_id
LEFT JOIN products p ON t.id = p.supplier_id
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
GROUP BY t.id, t.name, t.email, u.email, t.phone, t.address, t.postal_code
ORDER BY product_count DESC, active_products DESC
LIMIT 1;

-- Alternative: If no products exist yet, get a supplier from Singapore import
SELECT 
    t.id as supplier_id,
    t.name as supplier_name,
    t.email as supplier_email,
    u.email as login_email,
    'Demo123!' as demo_password,
    COUNT(p.id) as product_count,
    t.phone,
    t.address,
    t.postal_code,
    t.metadata->>'workhead' as bca_workhead,
    t.metadata->>'grade' as bca_grade
FROM tenants t
JOIN users u ON t.id = u.tenant_id
LEFT JOIN products p ON t.id = p.supplier_id
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
  AND t.metadata->>'source' = 'BCA Registered Contractors'
GROUP BY t.id, t.name, t.email, u.email, t.phone, t.address, t.postal_code, t.metadata
ORDER BY product_count DESC, t.created_at DESC
LIMIT 1;
