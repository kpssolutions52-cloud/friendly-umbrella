-- Migration: Add Service Pricing Fields
-- This script adds ratePerHour and rateType fields for services

-- Step 1: Add rate_per_hour column to products table
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "rate_per_hour" DECIMAL(10, 2);

-- Step 2: Add rate_type column to products table
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "rate_type" VARCHAR(50);

-- Step 3: Add indexes for service pricing fields
CREATE INDEX IF NOT EXISTS "products_rate_per_hour_idx" ON "products"("rate_per_hour") WHERE "rate_per_hour" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "products_rate_type_idx" ON "products"("rate_type") WHERE "rate_type" IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN "products"."rate_per_hour" IS 'Hourly rate for services (only used when type is service)';
COMMENT ON COLUMN "products"."rate_type" IS 'Pricing type for services: per_hour, per_project, fixed, negotiable';
