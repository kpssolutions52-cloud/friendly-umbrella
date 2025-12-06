-- ============================================
-- Construction Pricing Platform Database Setup
-- Execute these scripts in order
-- ============================================

-- Script 1: Create Enums
-- ============================================
CREATE TYPE "TenantType" AS ENUM ('supplier', 'company');
CREATE TYPE "TenantStatus" AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'supplier_admin', 'supplier_staff', 'company_admin', 'company_staff');
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'rejected', 'inactive');
CREATE TYPE "PriceType" AS ENUM ('default', 'private');

-- Script 2: Create Tenants Table
-- ============================================
CREATE TABLE "tenants" (
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

CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");
CREATE INDEX "tenants_type_idx" ON "tenants"("type");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");
CREATE INDEX "tenants_is_active_idx" ON "tenants"("is_active");
CREATE INDEX "tenants_status_type_idx" ON "tenants"("status", "type");

-- Script 3: Create Users Table
-- ============================================
CREATE TABLE "users" (
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

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "users_tenant_id_status_idx" ON "users"("tenant_id", "status");

ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Script 4: Create Products Table
-- ============================================
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "unit" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_supplier_id_sku_key" ON "products"("supplier_id", "sku");
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");
CREATE INDEX "products_is_active_idx" ON "products"("is_active");
CREATE INDEX "products_sku_idx" ON "products"("sku");
CREATE INDEX "products_category_idx" ON "products"("category");

ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Script 5: Create Default Prices Table
-- ============================================
CREATE TABLE "default_prices" (
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

CREATE INDEX "default_prices_product_id_idx" ON "default_prices"("product_id");
CREATE INDEX "default_prices_is_active_idx" ON "default_prices"("is_active");
CREATE INDEX "default_prices_effective_from_effective_until_idx" ON "default_prices"("effective_from", "effective_until");

ALTER TABLE "default_prices" ADD CONSTRAINT "default_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Script 6: Create Private Prices Table
-- ============================================
CREATE TABLE "private_prices" (
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

CREATE UNIQUE INDEX "private_prices_product_id_company_id_effective_from_key" ON "private_prices"("product_id", "company_id", "effective_from");
CREATE INDEX "private_prices_product_id_idx" ON "private_prices"("product_id");
CREATE INDEX "private_prices_company_id_idx" ON "private_prices"("company_id");
CREATE INDEX "private_prices_is_active_idx" ON "private_prices"("is_active");
CREATE INDEX "private_prices_effective_from_effective_until_idx" ON "private_prices"("effective_from", "effective_until");

ALTER TABLE "private_prices" ADD CONSTRAINT "private_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "private_prices" ADD CONSTRAINT "private_prices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Script 7: Create Price Audit Log Table
-- ============================================
CREATE TABLE "price_audit_log" (
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

CREATE INDEX "price_audit_log_product_id_idx" ON "price_audit_log"("product_id");
CREATE INDEX "price_audit_log_company_id_idx" ON "price_audit_log"("company_id");
CREATE INDEX "price_audit_log_changed_by_idx" ON "price_audit_log"("changed_by");
CREATE INDEX "price_audit_log_changed_at_idx" ON "price_audit_log"("changed_at");
CREATE INDEX "price_audit_log_price_type_idx" ON "price_audit_log"("price_type");

ALTER TABLE "price_audit_log" ADD CONSTRAINT "price_audit_log_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_audit_log" ADD CONSTRAINT "price_audit_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Script 8: Create Price Views Table
-- ============================================
CREATE TABLE "price_views" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price_type" "PriceType" NOT NULL,

    CONSTRAINT "price_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_views_product_id_idx" ON "price_views"("product_id");
CREATE INDEX "price_views_company_id_idx" ON "price_views"("company_id");
CREATE INDEX "price_views_viewed_at_idx" ON "price_views"("viewed_at");

ALTER TABLE "price_views" ADD CONSTRAINT "price_views_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_views" ADD CONSTRAINT "price_views_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_views" ADD CONSTRAINT "price_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

