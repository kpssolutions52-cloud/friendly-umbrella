-- Add sku column to products table if it doesn't exist
-- This script is idempotent - safe to run multiple times

-- Step 1: Check if column exists
DO $$
BEGIN
    -- Add sku column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'sku'
    ) THEN
        -- Add the column
        ALTER TABLE products 
        ADD COLUMN sku VARCHAR(100) NOT NULL DEFAULT '';
        
        -- Generate SKUs for existing products
        UPDATE products 
        SET sku = UPPER(SUBSTRING(name, 1, 3)) || '-' || LPAD(EXTRACT(EPOCH FROM created_at)::bigint::text, 6, '0')
        WHERE sku = '' OR sku IS NULL;
        
        -- Remove default after populating
        ALTER TABLE products 
        ALTER COLUMN sku DROP DEFAULT;
        
        RAISE NOTICE 'Added sku column to products table and populated existing records';
    ELSE
        RAISE NOTICE 'sku column already exists in products table';
    END IF;
END $$;

-- Step 2: Verify the column exists and has data
SELECT 
    COUNT(*) as total_products,
    COUNT(sku) as products_with_sku,
    COUNT(*) - COUNT(sku) as products_without_sku
FROM products;

-- Step 3: Show sample products with their SKUs
SELECT id, name, sku, price, unit, created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;
