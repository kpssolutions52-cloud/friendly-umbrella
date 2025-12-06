-- Script 5: Create Default Prices Table
-- Execute after Script 4

CREATE TABLE IF NOT EXISTS "default_prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price" DECIMAL(12, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "default_prices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "default_prices_product_id_idx" ON "default_prices"("product_id");
CREATE INDEX IF NOT EXISTS "default_prices_is_active_idx" ON "default_prices"("is_active");
CREATE INDEX IF NOT EXISTS "default_prices_effective_from_effective_until_idx" ON "default_prices"("effective_from", "effective_until");

ALTER TABLE "default_prices" ADD CONSTRAINT "default_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

