-- Sync product_categories with catalog_categories (3-level hierarchy)
-- WARNING: This will replace existing product_categories.

BEGIN;

UPDATE "products" SET "category_id" = NULL;
TRUNCATE TABLE "product_categories" RESTART IDENTITY CASCADE;

INSERT INTO "product_categories" ("id", "name", "description", "icon_url", "parent_id", "is_active", "display_order", "created_at", "updated_at")
SELECT
  c.id,
  c.name,
  NULL,
  NULL,
  c.parent_id,
  c.is_active,
  c.display_order,
  c.created_at,
  c.updated_at
FROM "catalog_categories" c;

COMMIT;
