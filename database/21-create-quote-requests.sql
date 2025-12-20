-- Create quote_requests table
-- This table stores RFQ (Request for Quote) submissions from companies
-- For general RFQs (not product-specific), the productId will reference a placeholder product

CREATE TABLE IF NOT EXISTS "quote_requests" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "company_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10, 2),
    "unit" VARCHAR(50),
    "requested_price" DECIMAL(12, 2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "message" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'pending',
    "requested_by" TEXT NOT NULL,
    "responded_by" TEXT,
    "responded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "quote_requests_company_id_fkey" 
        FOREIGN KEY ("company_id") 
        REFERENCES "tenants"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "quote_requests_supplier_id_fkey" 
        FOREIGN KEY ("supplier_id") 
        REFERENCES "tenants"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "quote_requests_product_id_fkey" 
        FOREIGN KEY ("product_id") 
        REFERENCES "products"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "quote_requests_requested_by_fkey" 
        FOREIGN KEY ("requested_by") 
        REFERENCES "users"("id") 
        ON UPDATE CASCADE,
    
    CONSTRAINT "quote_requests_responded_by_fkey" 
        FOREIGN KEY ("responded_by") 
        REFERENCES "users"("id") 
        ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "quote_requests_company_id_idx" ON "quote_requests"("company_id");
CREATE INDEX IF NOT EXISTS "quote_requests_supplier_id_idx" ON "quote_requests"("supplier_id");
CREATE INDEX IF NOT EXISTS "quote_requests_product_id_idx" ON "quote_requests"("product_id");
CREATE INDEX IF NOT EXISTS "quote_requests_status_idx" ON "quote_requests"("status");
CREATE INDEX IF NOT EXISTS "quote_requests_requested_by_idx" ON "quote_requests"("requested_by");
CREATE INDEX IF NOT EXISTS "quote_requests_created_at_idx" ON "quote_requests"("created_at");
CREATE INDEX IF NOT EXISTS "quote_requests_company_status_idx" ON "quote_requests"("company_id", "status");
CREATE INDEX IF NOT EXISTS "quote_requests_supplier_status_idx" ON "quote_requests"("supplier_id", "status");

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quote_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_requests_updated_at_trigger
    BEFORE UPDATE ON "quote_requests"
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_requests_updated_at();

-- Add comment to table
COMMENT ON TABLE "quote_requests" IS 'Stores RFQ (Request for Quote) submissions from companies. General RFQs use a placeholder product.';
