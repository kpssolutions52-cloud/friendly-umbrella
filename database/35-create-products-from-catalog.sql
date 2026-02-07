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
DO $$
DECLARE
    supplier_count INTEGER;
    catalog_item_count INTEGER;
    products_per_supplier INTEGER;
    supplier_record RECORD;
    catalog_item_record RECORD;
    product_count INTEGER := 0;
    supplier_num INTEGER;
    sku_base TEXT;
    new_price NUMERIC(12,2);
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO supplier_count
    FROM organizations o
    JOIN tenants t ON o.email = t.email
    WHERE o.type::text = 'supplier'
      AND t.type = 'supplier'
      AND t.status = 'active';
    
    SELECT COUNT(*) INTO catalog_item_count
    FROM catalog_items
    WHERE is_active = true;
    
    -- Calculate how many products per supplier (distribute catalog items)
    products_per_supplier := GREATEST(1, catalog_item_count / GREATEST(supplier_count, 1));
    
    -- For each supplier, assign a subset of catalog items
    FOR supplier_record IN 
        SELECT 
            o.id as org_id,
            o.name as org_name,
            o.email as org_email,
            t.id as tenant_id
        FROM organizations o
        JOIN tenants t ON o.email = t.email
        WHERE o.type::text = 'supplier'
          AND t.type = 'supplier'
          AND t.status = 'active'
        ORDER BY RANDOM()
    LOOP
        supplier_num := 0;
        
        -- Assign 1-3 catalog items per supplier (random selection)
        FOR catalog_item_record IN
            SELECT 
                ci.id,
                ci.name,
                ci.unit_code,
                ci.code,
                ci.description
            FROM catalog_items ci
            WHERE ci.is_active = true
              AND NOT EXISTS (
                  -- Skip if product already exists for this supplier
                  SELECT 1 
                  FROM products p 
                  WHERE p.supplier_id = supplier_record.org_id
                    AND p.catalog_item_id = ci.id
              )
            ORDER BY RANDOM()
            LIMIT (1 + FLOOR(RANDOM() * 3)::int)
        LOOP
            supplier_num := supplier_num + 1;
            
            -- Generate SKU
            sku_base := UPPER(SUBSTRING(REPLACE(supplier_record.org_name, ' ', ''), 1, 3));
            IF catalog_item_record.code IS NOT NULL THEN
                sku_base := sku_base || '-' || catalog_item_record.code;
            ELSE
                sku_base := sku_base || '-' || UPPER(SUBSTRING(REPLACE(catalog_item_record.name, ' ', ''), 1, 8));
            END IF;
            sku_base := sku_base || '-' || LPAD(supplier_num::text, 4, '0');
            
            -- Random price between 10 and 1000
            new_price := (10 + (RANDOM() * 990))::numeric(12,2);
            
            -- Insert product
            BEGIN
                INSERT INTO products (
                    id,
                    supplier_id,
                    name,
                    sku,
                    price,
                    unit,
                    stock_availability,
                    is_active,
                    catalog_item_id
                ) VALUES (
                    gen_random_uuid()::text,
                    supplier_record.org_id,
                    catalog_item_record.name,
                    sku_base,
                    new_price,
                    catalog_item_record.unit_code,
                    'in_stock',
                    true,
                    catalog_item_record.id
                )
                ON CONFLICT (supplier_id, sku) DO NOTHING;
                
                GET DIAGNOSTICS supplier_num = ROW_COUNT;
                product_count := product_count + supplier_num;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Log error but continue
                    RAISE WARNING 'Error inserting product for supplier %: %', supplier_record.org_name, SQLERRM;
            END;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '=== PRODUCT CREATION COMPLETE ===';
    RAISE NOTICE 'Total products created: %', product_count;
    RAISE NOTICE 'Suppliers processed: %', supplier_count;
    RAISE NOTICE 'Catalog items available: %', catalog_item_count;
END $$;

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
