-- Script 7: Create Price Audit Log Table
-- Execute after Scripts 3 and 4

CREATE TABLE IF NOT EXISTS "price_audit_log" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_type" "PriceType" NOT NULL,
    "company_id" TEXT,
    "old_price" DECIMAL(12, 2),
    "new_price" DECIMAL(12, 2) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_reason" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "price_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "price_audit_log_product_id_idx" ON "price_audit_log"("product_id");
CREATE INDEX IF NOT EXISTS "price_audit_log_company_id_idx" ON "price_audit_log"("company_id");
CREATE INDEX IF NOT EXISTS "price_audit_log_changed_by_idx" ON "price_audit_log"("changed_by");
CREATE INDEX IF NOT EXISTS "price_audit_log_changed_at_idx" ON "price_audit_log"("changed_at");
CREATE INDEX IF NOT EXISTS "price_audit_log_price_type_idx" ON "price_audit_log"("price_type");

ALTER TABLE "price_audit_log" ADD CONSTRAINT "price_audit_log_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_audit_log" ADD CONSTRAINT "price_audit_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

