-- Migration: Add Products and Services Support
-- This script adds support for products vs services, service providers, and service categories

-- Step 1: Add ProductType enum
DO $$ BEGIN
    CREATE TYPE "ProductType" AS ENUM ('product', 'service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add service_provider to TenantType enum
DO $$ BEGIN
    ALTER TYPE "TenantType" ADD VALUE IF NOT EXISTS 'service_provider';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add service provider roles to UserRole enum
DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'service_provider_admin';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'service_provider_staff';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 4: Add type and serviceCategoryId columns to products table
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "type" "ProductType" NOT NULL DEFAULT 'product',
ADD COLUMN IF NOT EXISTS "service_category_id" UUID;

-- Step 5: Create service_categories table
CREATE TABLE IF NOT EXISTS "service_categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon_url" VARCHAR(500),
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_categories_name_parent_id_key" UNIQUE ("name", "parent_id"),
    CONSTRAINT "service_categories_parent_id_fkey" FOREIGN KEY ("parent_id") 
        REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 6: Add foreign key constraint for service_category_id in products table
DO $$ BEGIN
    ALTER TABLE "products" 
    ADD CONSTRAINT "products_service_category_id_fkey" 
    FOREIGN KEY ("service_category_id") 
    REFERENCES "service_categories"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 7: Create indexes for service_categories
CREATE INDEX IF NOT EXISTS "service_categories_parent_id_idx" ON "service_categories"("parent_id");
CREATE INDEX IF NOT EXISTS "service_categories_is_active_idx" ON "service_categories"("is_active");
CREATE INDEX IF NOT EXISTS "service_categories_name_idx" ON "service_categories"("name");
CREATE INDEX IF NOT EXISTS "service_categories_display_order_idx" ON "service_categories"("display_order");

-- Step 8: Create indexes for products table (type and serviceCategoryId)
CREATE INDEX IF NOT EXISTS "products_type_idx" ON "products"("type");
CREATE INDEX IF NOT EXISTS "products_service_category_id_idx" ON "products"("service_category_id");

-- Step 9: Add comment for documentation
COMMENT ON COLUMN "products"."type" IS 'Type of item: product (from supplier) or service (from service provider)';
COMMENT ON COLUMN "products"."service_category_id" IS 'Reference to service category (only used when type is service)';
COMMENT ON TABLE "service_categories" IS 'Service categories for civil consultancy and part-time job services';

-- Step 10: Update updated_at trigger for service_categories (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_service_categories_updated_at 
    BEFORE UPDATE ON "service_categories"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verification queries (optional - uncomment to verify)
-- SELECT enum_range(NULL::"ProductType");
-- SELECT unnest(enum_range(NULL::"TenantType"));
-- SELECT unnest(enum_range(NULL::"UserRole"));
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name IN ('type', 'service_category_id');
-- SELECT COUNT(*) FROM "service_categories";
