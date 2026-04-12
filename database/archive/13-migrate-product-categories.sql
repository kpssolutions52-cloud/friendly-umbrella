-- Migrate existing product categories to the categories table
-- This script extracts unique categories from products and adds them to the categories table
-- Run this after creating the categories table (11-create-categories.sql)

-- Step 1: Insert distinct categories from products table into categories table
-- This handles case-insensitive duplicates and trims whitespace
INSERT INTO "categories" ("name", "created_at", "updated_at")
SELECT DISTINCT
    TRIM(p.category) as name,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM "products" p
WHERE p.category IS NOT NULL
  AND TRIM(p.category) != ''
  AND NOT EXISTS (
    -- Check if category already exists (case-insensitive comparison)
    SELECT 1 
    FROM "categories" c 
    WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p.category))
  )
ON CONFLICT ("name") DO NOTHING;

-- Step 2: Display migration summary
DO $$
DECLARE
    product_category_count INTEGER;
    unique_product_categories INTEGER;
    categories_before INTEGER;
    categories_after INTEGER;
    inserted_count INTEGER;
BEGIN
    -- Count total product categories
    SELECT COUNT(*) INTO product_category_count
    FROM "products"
    WHERE category IS NOT NULL AND TRIM(category) != '';
    
    -- Count unique product categories
    SELECT COUNT(DISTINCT LOWER(TRIM(category))) INTO unique_product_categories
    FROM "products"
    WHERE category IS NOT NULL AND TRIM(category) != '';
    
    -- Count categories in categories table (after migration)
    SELECT COUNT(*) INTO categories_after FROM "categories";
    
    -- Calculate how many were inserted (categories that existed in products but not in categories)
    SELECT COUNT(*) INTO inserted_count
    FROM (
        SELECT DISTINCT LOWER(TRIM(category)) as cat
        FROM "products"
        WHERE category IS NOT NULL AND TRIM(category) != ''
    ) p
    WHERE NOT EXISTS (
        SELECT 1 
        FROM "categories" c 
        WHERE LOWER(TRIM(c.name)) = p.cat
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Category Migration Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total products with categories: %', product_category_count;
    RAISE NOTICE 'Unique product categories: %', unique_product_categories;
    RAISE NOTICE 'Categories in categories table: %', categories_after;
    RAISE NOTICE 'New categories inserted: %', inserted_count;
    RAISE NOTICE '========================================';
END $$;
