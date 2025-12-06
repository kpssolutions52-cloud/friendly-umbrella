-- Script 6: Create Private Prices Table
-- Execute after Scripts 2 and 4

CREATE TABLE IF NOT EXISTS "private_prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "price" DECIMAL(12, 2),
    "discount_percentage" DECIMAL(5, 2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "private_prices_product_id_company_id_effective_from_key" ON "private_prices"("product_id", "company_id", "effective_from");
CREATE INDEX IF NOT EXISTS "private_prices_product_id_idx" ON "private_prices"("product_id");
CREATE INDEX IF NOT EXISTS "private_prices_company_id_idx" ON "private_prices"("company_id");
CREATE INDEX IF NOT EXISTS "private_prices_is_active_idx" ON "private_prices"("is_active");
CREATE INDEX IF NOT EXISTS "private_prices_effective_from_effective_until_idx" ON "private_prices"("effective_from", "effective_until");

ALTER TABLE "private_prices" ADD CONSTRAINT "private_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "private_prices" ADD CONSTRAINT "private_prices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

