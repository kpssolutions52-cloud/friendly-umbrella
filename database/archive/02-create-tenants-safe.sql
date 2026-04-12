-- Script 2: Create Tenants Table (Safe Version)
-- Execute after Script 1
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "TenantType" NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "postal_code" VARCHAR(20),
    "status" "TenantStatus" NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_email_key" ON "tenants"("email");
CREATE INDEX IF NOT EXISTS "tenants_type_idx" ON "tenants"("type");
CREATE INDEX IF NOT EXISTS "tenants_status_idx" ON "tenants"("status");
CREATE INDEX IF NOT EXISTS "tenants_is_active_idx" ON "tenants"("is_active");
CREATE INDEX IF NOT EXISTS "tenants_status_type_idx" ON "tenants"("status", "type");

