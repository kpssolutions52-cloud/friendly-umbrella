-- Add supplier profile fields to tenants table
-- These fields are specific to construction suppliers

ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "registration_number" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "contact_person" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "website" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "tax_id" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "business_license" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "state" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "country" VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN "tenants"."registration_number" IS 'Company registration number (e.g., business registration, company registration number)';
COMMENT ON COLUMN "tenants"."contact_person" IS 'Primary contact person name';
COMMENT ON COLUMN "tenants"."website" IS 'Company website URL';
COMMENT ON COLUMN "tenants"."tax_id" IS 'Tax identification number';
COMMENT ON COLUMN "tenants"."business_license" IS 'Business license number';
COMMENT ON COLUMN "tenants"."description" IS 'Company description/summary';
COMMENT ON COLUMN "tenants"."city" IS 'City';
COMMENT ON COLUMN "tenants"."state" IS 'State/Province';
COMMENT ON COLUMN "tenants"."country" IS 'Country';

-- Create index on registration_number for faster lookups
CREATE INDEX IF NOT EXISTS "tenants_registration_number_idx" ON "tenants"("registration_number");
