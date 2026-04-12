-- Fix null price values in products table
-- The price column is non-nullable in the new schema

-- Step 1: Check how many products have null prices
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE price IS NULL) as null_price_count,
    COUNT(*) FILTER (WHERE price IS NOT NULL) as has_price_count
FROM products;

-- Step 2: Show products with null prices
SELECT id, name, supplier_id, price, unit, created_at
FROM products
WHERE price IS NULL
LIMIT 20;

-- Step 3: Option 1 - Delete products with null prices (if they're invalid/test data)
-- Uncomment if you want to delete:
-- DELETE FROM products WHERE price IS NULL;

-- Step 3: Option 2 - Set a default price for products with null prices
-- This is safer if you want to keep the products
-- You can set a default price (e.g., 0.01 or a reasonable default)
UPDATE products
SET price = 0.01  -- Set a minimal default price
WHERE price IS NULL;

-- Alternative: Set price based on product name or other criteria
-- UPDATE products
-- SET price = CASE 
--     WHEN LOWER(name) LIKE '%cement%' THEN 50.00
--     WHEN LOWER(name) LIKE '%steel%' THEN 500.00
--     WHEN LOWER(name) LIKE '%sand%' THEN 30.00
--     ELSE 10.00  -- Default price
-- END
-- WHERE price IS NULL;

-- Step 4: Verify the fix
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE price IS NULL) as null_price_count,
    COUNT(*) FILTER (WHERE price IS NOT NULL) as has_price_count,
    MIN(price) as min_price,
    MAX(price) as max_price,
    AVG(price) as avg_price
FROM products;

-- Step 5: Show any remaining issues
SELECT id, name, supplier_id, price, unit
FROM products
WHERE price IS NULL
LIMIT 10;
