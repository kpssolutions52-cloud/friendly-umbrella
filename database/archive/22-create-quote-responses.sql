-- Create quote_responses table
-- This table stores supplier responses to quote requests

CREATE TABLE IF NOT EXISTS "quote_responses" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "quote_request_id" TEXT NOT NULL,
    "price" DECIMAL(12, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "quantity" DECIMAL(10, 2),
    "unit" VARCHAR(50),
    "valid_until" TIMESTAMP(3),
    "message" TEXT,
    "terms" TEXT,
    "responded_by" TEXT NOT NULL,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_accepted" BOOLEAN NOT NULL DEFAULT FALSE,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT "quote_responses_quote_request_id_fkey" 
        FOREIGN KEY ("quote_request_id") 
        REFERENCES "quote_requests"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    CONSTRAINT "quote_responses_responded_by_fkey" 
        FOREIGN KEY ("responded_by") 
        REFERENCES "users"("id") 
        ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "quote_responses_quote_request_id_idx" ON "quote_responses"("quote_request_id");
CREATE INDEX IF NOT EXISTS "quote_responses_responded_by_idx" ON "quote_responses"("responded_by");
CREATE INDEX IF NOT EXISTS "quote_responses_responded_at_idx" ON "quote_responses"("responded_at");
CREATE INDEX IF NOT EXISTS "quote_responses_is_accepted_idx" ON "quote_responses"("is_accepted");

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quote_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_responses_updated_at_trigger
    BEFORE UPDATE ON "quote_responses"
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_responses_updated_at();

-- Add comment to table
COMMENT ON TABLE "quote_responses" IS 'Stores supplier responses to quote requests with pricing, terms, and acceptance status.';
