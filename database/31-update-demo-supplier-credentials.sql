-- Update demo supplier credentials
-- This script finds the supplier with the most products and ensures it has demo credentials
-- Run this after importing suppliers and products

-- Step 1: Find supplier with most products
WITH supplier_product_counts AS (
    SELECT 
        t.id as supplier_id,
        t.name as supplier_name,
        t.email as supplier_email,
        COUNT(p.id) as product_count,
        COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products
    FROM tenants t
    LEFT JOIN products p ON t.id = p.supplier_id
    WHERE t.type = 'supplier' AND t.status = 'active'
    GROUP BY t.id, t.name, t.email
),
top_supplier AS (
    SELECT 
        supplier_id,
        supplier_name,
        supplier_email,
        product_count,
        active_products
    FROM supplier_product_counts
    ORDER BY product_count DESC, active_products DESC
    LIMIT 1
)
SELECT 
    '=== DEMO SUPPLIER WITH MOST PRODUCTS ===' as info;

SELECT 
    ts.supplier_name,
    ts.supplier_email as login_email,
    'Demo123!' as demo_password,
    ts.product_count as total_products,
    ts.active_products,
    t.phone,
    t.address,
    t.postal_code
FROM top_supplier ts
JOIN tenants t ON ts.supplier_id = t.id;

-- Step 2: Ensure the top supplier has demo password set
-- Update user password to Demo123! for the supplier with most products
WITH supplier_product_counts AS (
    SELECT 
        t.id as supplier_id,
        t.email as supplier_email,
        COUNT(p.id) as product_count
    FROM tenants t
    LEFT JOIN products p ON t.id = p.supplier_id
    WHERE t.type = 'supplier' AND t.status = 'active'
    GROUP BY t.id, t.email
),
top_supplier AS (
    SELECT supplier_id, supplier_email
    FROM supplier_product_counts
    ORDER BY product_count DESC
    LIMIT 1
)
UPDATE users
SET password_hash = crypt('Demo123!', gen_salt('bf', 12))
FROM top_supplier ts
WHERE users.email = ts.supplier_email
  AND users.role = 'supplier_admin';

-- Step 3: Display updated credentials
SELECT 
    '=== UPDATED DEMO SUPPLIER CREDENTIALS ===' as info;

WITH supplier_product_counts AS (
    SELECT 
        t.id as supplier_id,
        t.name as supplier_name,
        t.email as supplier_email,
        COUNT(p.id) as product_count,
        COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products
    FROM tenants t
    LEFT JOIN products p ON t.id = p.supplier_id
    WHERE t.type = 'supplier' AND t.status = 'active'
    GROUP BY t.id, t.name, t.email
),
top_supplier AS (
    SELECT 
        supplier_id,
        supplier_name,
        supplier_email,
        product_count,
        active_products
    FROM supplier_product_counts
    ORDER BY product_count DESC, active_products DESC
    LIMIT 1
)
SELECT 
    ts.supplier_name as "Supplier Name",
    ts.supplier_email as "Login Email",
    'Demo123!' as "Password",
    ts.product_count as "Total Products",
    ts.active_products as "Active Products",
    '✅ Ready for Demo' as "Status"
FROM top_supplier ts;
