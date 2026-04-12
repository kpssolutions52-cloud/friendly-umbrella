-- Create catalog schema for standardized categories and items

-- 1) Units (standardized measurement units)
CREATE TABLE IF NOT EXISTS "catalog_units" (
    "code" TEXT PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "unit_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "catalog_units_unit_type_idx" ON "catalog_units"("unit_type");

-- 2) Categories (3-level hierarchy)
CREATE TABLE IF NOT EXISTS "catalog_categories" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(150) NOT NULL,
    "parent_id" TEXT,
    "level" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_categories_parent_id_fkey"
        FOREIGN KEY ("parent_id")
        REFERENCES "catalog_categories"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "catalog_categories_parent_id_idx" ON "catalog_categories"("parent_id");
CREATE INDEX IF NOT EXISTS "catalog_categories_level_idx" ON "catalog_categories"("level");
CREATE INDEX IF NOT EXISTS "catalog_categories_name_idx" ON "catalog_categories"("name");

-- 3) Items (standardized catalog)
CREATE TABLE IF NOT EXISTS "catalog_items" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "code" VARCHAR(80),
    "name" VARCHAR(255) NOT NULL,
    "unit_code" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT '{}',
    "source" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_items_unit_code_fkey"
        FOREIGN KEY ("unit_code")
        REFERENCES "catalog_units"("code")
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT "catalog_items_category_id_fkey"
        FOREIGN KEY ("category_id")
        REFERENCES "catalog_categories"("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "catalog_items_category_id_idx" ON "catalog_items"("category_id");
CREATE INDEX IF NOT EXISTS "catalog_items_unit_code_idx" ON "catalog_items"("unit_code");
CREATE INDEX IF NOT EXISTS "catalog_items_name_idx" ON "catalog_items"("name");
CREATE INDEX IF NOT EXISTS "catalog_items_tags_idx" ON "catalog_items" USING GIN ("tags");

-- 4) Item synonyms (vendor naming)
CREATE TABLE IF NOT EXISTS "catalog_item_synonyms" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "item_id" TEXT NOT NULL,
    "synonym" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalog_item_synonyms_item_id_fkey"
        FOREIGN KEY ("item_id")
        REFERENCES "catalog_items"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "catalog_item_synonyms_item_id_idx" ON "catalog_item_synonyms"("item_id");
CREATE INDEX IF NOT EXISTS "catalog_item_synonyms_synonym_idx" ON "catalog_item_synonyms"("synonym");

-- 5) Link supplier products to catalog items (optional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
          AND column_name = 'catalog_item_id'
    ) THEN
        ALTER TABLE "products"
        ADD COLUMN "catalog_item_id" TEXT;

        ALTER TABLE "products"
        ADD CONSTRAINT "products_catalog_item_id_fkey"
        FOREIGN KEY ("catalog_item_id")
        REFERENCES "catalog_items"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;

        CREATE INDEX IF NOT EXISTS "products_catalog_item_id_idx" ON "products"("catalog_item_id");
    END IF;
END $$;

-- Updated_at trigger (shared)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_catalog_units_updated_at
    BEFORE UPDATE ON "catalog_units"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_catalog_categories_updated_at
    BEFORE UPDATE ON "catalog_categories"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_catalog_items_updated_at
    BEFORE UPDATE ON "catalog_items"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
