-- Migration 15: Add category_id column to products table and create product_categories table
-- This migration adds support for hierarchical categories

-- Step 1: Create product_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS "product_categories" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon_url" VARCHAR(500),
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "product_categories_parent_id_fkey" 
        FOREIGN KEY ("parent_id") 
        REFERENCES "product_categories"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create unique constraint on name and parent_id (allows same name in different parents)
CREATE UNIQUE INDEX IF NOT EXISTS "product_categories_name_parent_id_key" 
    ON "product_categories"("name", "parent_id") 
    WHERE "parent_id" IS NOT NULL;

-- Create unique constraint on name when parent_id is NULL (main categories)
CREATE UNIQUE INDEX IF NOT EXISTS "product_categories_name_null_parent_key" 
    ON "product_categories"("name") 
    WHERE "parent_id" IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS "product_categories_parent_id_idx" ON "product_categories"("parent_id");
CREATE INDEX IF NOT EXISTS "product_categories_is_active_idx" ON "product_categories"("is_active");
CREATE INDEX IF NOT EXISTS "product_categories_display_order_idx" ON "product_categories"("display_order");

-- Step 2: Add category_id column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE "products" 
        ADD COLUMN "category_id" TEXT;
        
        -- Add foreign key constraint
        ALTER TABLE "products" 
        ADD CONSTRAINT "products_category_id_fkey" 
        FOREIGN KEY ("category_id") 
        REFERENCES "product_categories"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");
        
        RAISE NOTICE 'Added category_id column to products table';
    ELSE
        RAISE NOTICE 'category_id column already exists in products table';
    END IF;
END $$;

-- Step 3: Migrate existing category data from products.category to product_categories
-- Create main categories from unique product categories
INSERT INTO "product_categories" ("name", "is_active", "display_order", "created_at", "updated_at")
SELECT DISTINCT
    TRIM(p.category) as name,
    true as is_active,
    ROW_NUMBER() OVER (ORDER BY TRIM(p.category)) - 1 as display_order,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM "products" p
WHERE p.category IS NOT NULL
  AND TRIM(p.category) != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM "product_categories" pc 
    WHERE pc.name = TRIM(p.category) 
    AND pc.parent_id IS NULL
  )
ON CONFLICT DO NOTHING;

-- Step 4: Update products.category_id to reference the new product_categories
UPDATE "products" p
SET "category_id" = pc.id
FROM "product_categories" pc
WHERE TRIM(p.category) = pc.name
  AND pc.parent_id IS NULL
  AND p.category_id IS NULL;

-- Step 5: Display migration summary
DO $$
DECLARE
    products_with_category INTEGER;
    products_migrated INTEGER;
    categories_created INTEGER;
BEGIN
    SELECT COUNT(*) INTO products_with_category
    FROM "products"
    WHERE category IS NOT NULL AND TRIM(category) != '';
    
    SELECT COUNT(*) INTO products_migrated
    FROM "products"
    WHERE category_id IS NOT NULL;
    
    SELECT COUNT(*) INTO categories_created
    FROM "product_categories"
    WHERE parent_id IS NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Category Migration Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Products with category (old): %', products_with_category;
    RAISE NOTICE 'Products migrated (category_id set): %', products_migrated;
    RAISE NOTICE 'Main categories created: %', categories_created;
    RAISE NOTICE '========================================';
END $$;
