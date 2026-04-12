-- Script 4: Create Products Table
-- Execute after Script 2

CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "unit" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_supplier_id_sku_key" ON "products"("supplier_id", "sku");
CREATE INDEX IF NOT EXISTS "products_supplier_id_idx" ON "products"("supplier_id");
CREATE INDEX IF NOT EXISTS "products_is_active_idx" ON "products"("is_active");
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");

ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

