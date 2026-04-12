-- Script 8: Create Price Views Table
-- Execute after Scripts 2, 3, and 4

CREATE TABLE IF NOT EXISTS "price_views" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price_type" "PriceType" NOT NULL,

    CONSTRAINT "price_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "price_views_product_id_idx" ON "price_views"("product_id");
CREATE INDEX IF NOT EXISTS "price_views_company_id_idx" ON "price_views"("company_id");
CREATE INDEX IF NOT EXISTS "price_views_viewed_at_idx" ON "price_views"("viewed_at");

ALTER TABLE "price_views" ADD CONSTRAINT "price_views_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_views" ADD CONSTRAINT "price_views_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_views" ADD CONSTRAINT "price_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

