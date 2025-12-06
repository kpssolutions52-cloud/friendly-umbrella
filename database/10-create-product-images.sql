-- Script: Create product_images table
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "image_url" VARCHAR(500) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images"("product_id");
CREATE INDEX IF NOT EXISTS "product_images_product_id_display_order_idx" ON "product_images"("product_id", "display_order");

-- Add comment
COMMENT ON TABLE "product_images" IS 'Stores product images uploaded by suppliers';

