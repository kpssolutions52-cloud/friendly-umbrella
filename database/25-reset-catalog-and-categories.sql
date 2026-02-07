-- Reset existing categories and catalog data before re-seeding
-- WARNING: This will remove existing product category links.

BEGIN;

-- Clear product links first
UPDATE "products" SET "category_id" = NULL;
UPDATE "products" SET "catalog_item_id" = NULL;

-- Clear existing category trees
TRUNCATE TABLE "product_categories" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "catalog_item_synonyms" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "catalog_items" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "catalog_categories" RESTART IDENTITY CASCADE;

COMMIT;
