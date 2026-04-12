-- Script 3: Create Users Table
-- Execute after Script 2

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "permissions" JSONB DEFAULT '{}',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_tenant_id_status_idx" ON "users"("tenant_id", "status");

ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

