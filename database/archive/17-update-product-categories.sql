-- Script 15: Update Product Categories Table Structure
-- This script creates the product_categories table with hierarchical support
-- and updates the products table to use category_id instead of category string
-- 
-- WARNING: This script will DROP the product_categories table if it exists,
-- which will delete all existing category data. Run script 16 to re-insert categories.

-- Step 1: Drop product_categories table if it exists (CASCADE will drop all dependent objects)
DROP TABLE IF EXISTS "product_categories" CASCADE;

-- Step 2: Create product_categories table fresh with all constraints
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon_url" VARCHAR(500),
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Self-referential foreign key for parent-child relationship
    CONSTRAINT "product_categories_parent_id_fkey" 
        FOREIGN KEY ("parent_id") 
        REFERENCES "product_categories"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Unique constraint: same name allowed in different parents
    CONSTRAINT "product_categories_name_parent_id_key" 
        UNIQUE ("name", "parent_id")
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "product_categories_parent_id_idx" ON "product_categories"("parent_id");
CREATE INDEX IF NOT EXISTS "product_categories_is_active_idx" ON "product_categories"("is_active");
CREATE INDEX IF NOT EXISTS "product_categories_name_idx" ON "product_categories"("name");
CREATE INDEX IF NOT EXISTS "product_categories_display_order_idx" ON "product_categories"("display_order");

-- Step 4: Add category_id column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE "products" 
        ADD COLUMN "category_id" TEXT;
    END IF;
END $$;

-- Step 5: Create foreign key constraint for category_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_category_id_fkey'
    ) THEN
        ALTER TABLE "products" 
        ADD CONSTRAINT "products_category_id_fkey" 
        FOREIGN KEY ("category_id") 
        REFERENCES "product_categories"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 6: Create index on category_id if it doesn't exist
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");

-- Step 7: Migrate existing category strings to category_id (optional)
-- This will try to match existing category strings to product_categories by name
-- Note: This only works if categories have already been inserted via script 16
-- Uncomment this section after running 16-insert-product-categories.sql if you want to migrate existing data

/*
UPDATE "products" p
SET "category_id" = pc.id
FROM "product_categories" pc
WHERE p.category IS NOT NULL 
  AND TRIM(p.category) != ''
  AND pc.name = TRIM(p.category)
  AND pc.parent_id IS NULL  -- Match only main categories
  AND p.category_id IS NULL;
*/

-- Step 8: Display summary
DO $$
DECLARE
    category_count INTEGER;
    products_with_category_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM "product_categories";
    SELECT COUNT(*) INTO products_with_category_id FROM "products" WHERE "category_id" IS NOT NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Product Categories Table Update Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total categories in product_categories: %', category_count;
    RAISE NOTICE 'Products with category_id set: %', products_with_category_id;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run 16-insert-product-categories.sql to seed categories';
    RAISE NOTICE '========================================';
END $$;

