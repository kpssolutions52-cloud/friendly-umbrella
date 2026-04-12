-- Script 0: Cleanup (Optional - Only run if you want to start fresh)
-- WARNING: This will delete all data and tables!
-- Only run this if you want to completely reset the database

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "price_views" CASCADE;
DROP TABLE IF EXISTS "price_audit_log" CASCADE;
DROP TABLE IF EXISTS "private_prices" CASCADE;
DROP TABLE IF EXISTS "default_prices" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "tenants" CASCADE;

-- Drop types
DROP TYPE IF EXISTS "PriceType" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "TenantStatus" CASCADE;
DROP TYPE IF EXISTS "TenantType" CASCADE;

