-- ============================================================================
-- MIGRATION 05: Cleanup Old Tables (OPTIONAL - Run Only After Verification)
-- ============================================================================
-- WARNING: This permanently deletes old tables and data!
-- Only run this AFTER you've verified the new system works correctly
-- Consider keeping old tables for a few weeks as additional backup
-- ============================================================================

-- Drop old tables (uncomment when ready)
-- DROP TABLE IF EXISTS users_old CASCADE;
-- DROP TABLE IF EXISTS products_old CASCADE;
-- DROP TABLE IF EXISTS tenants_old CASCADE;

-- Drop old related tables (no longer needed)
-- DROP TABLE IF EXISTS default_prices CASCADE;
-- DROP TABLE IF EXISTS private_prices CASCADE;
-- DROP TABLE IF EXISTS price_audit_log CASCADE;
-- DROP TABLE IF EXISTS price_views CASCADE;
-- DROP TABLE IF EXISTS quote_requests CASCADE;
-- DROP TABLE IF EXISTS quote_responses CASCADE;
-- DROP TABLE IF EXISTS product_categories CASCADE;
-- DROP TABLE IF EXISTS service_categories CASCADE;
-- DROP TABLE IF EXISTS product_images CASCADE;

-- Drop old enums (if not used elsewhere)
-- DROP TYPE IF EXISTS "TenantType" CASCADE;
-- DROP TYPE IF EXISTS "TenantStatus" CASCADE;
-- DROP TYPE IF EXISTS "UserRole" CASCADE;
-- DROP TYPE IF EXISTS "UserStatus" CASCADE;
-- DROP TYPE IF EXISTS "ProductType" CASCADE;
-- DROP TYPE IF EXISTS "PriceType" CASCADE;
-- DROP TYPE IF EXISTS "QuoteStatus" CASCADE;

-- Note: Backup tables (tenants_backup, users_backup, etc.) should be kept
-- They can be dropped later after full verification

DO $$
BEGIN
    RAISE NOTICE 'Cleanup script ready. Uncomment DROP statements when ready.';
    RAISE NOTICE 'Recommendation: Keep old tables for at least 2 weeks for safety.';
END $$;
