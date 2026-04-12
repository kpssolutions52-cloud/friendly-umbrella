-- Query to view categories after migration
-- Run this after executing 13-migrate-product-categories.sql

-- 1. View all categories in the categories table
SELECT 
    id,
    name,
    image_url,
    created_at,
    updated_at
FROM "categories"
ORDER BY name ASC;

-- 2. Count total categories
SELECT 
    COUNT(*) as total_categories,
    COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as categories_with_images,
    COUNT(CASE WHEN image_url IS NULL THEN 1 END) as categories_without_images
FROM "categories";

-- 3. Compare categories table with product categories
-- Shows which product categories exist in categories table and which don't
SELECT 
    p.category as product_category,
    CASE 
        WHEN c.name IS NOT NULL THEN '✅ In categories table'
        ELSE '❌ Missing from categories table'
    END as status,
    COUNT(p.id) as product_count
FROM "products" p
LEFT JOIN "categories" c ON LOWER(TRIM(c.name)) = LOWER(TRIM(p.category))
WHERE p.category IS NOT NULL 
  AND TRIM(p.category) != ''
GROUP BY p.category, c.name
ORDER BY p.category ASC;

-- 4. List all unique product categories (for comparison)
SELECT DISTINCT
    TRIM(category) as product_category,
    COUNT(*) as product_count
FROM "products"
WHERE category IS NOT NULL 
  AND TRIM(category) != ''
GROUP BY TRIM(category)
ORDER BY TRIM(category) ASC;

-- 5. Categories in categories table that are NOT used by any products
SELECT 
    c.name as unused_category,
    c.created_at,
    c.image_url
FROM "categories" c
LEFT JOIN "products" p ON LOWER(TRIM(c.name)) = LOWER(TRIM(p.category))
WHERE p.id IS NULL
ORDER BY c.name ASC;

-- 6. Summary comparison
SELECT 
    (SELECT COUNT(DISTINCT LOWER(TRIM(category))) 
     FROM "products" 
     WHERE category IS NOT NULL AND TRIM(category) != '') as unique_product_categories,
    (SELECT COUNT(*) FROM "categories") as total_categories_in_table,
    (SELECT COUNT(DISTINCT LOWER(TRIM(c.name))) 
     FROM "categories" c
     INNER JOIN "products" p ON LOWER(TRIM(c.name)) = LOWER(TRIM(p.category))
     WHERE p.category IS NOT NULL AND TRIM(p.category) != '') as categories_used_by_products,
    (SELECT COUNT(*) 
     FROM "categories" c
     LEFT JOIN "products" p ON LOWER(TRIM(c.name)) = LOWER(TRIM(p.category))
     WHERE p.id IS NULL) as unused_categories;
