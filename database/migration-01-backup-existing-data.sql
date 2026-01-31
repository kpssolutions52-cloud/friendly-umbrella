-- ============================================================================
-- MIGRATION 01: Backup Existing Data
-- ============================================================================
-- IMPORTANT: Run this FIRST to backup existing data before migration
-- This creates backup tables with all current data
-- ============================================================================

-- Backup Tenants (will become Organizations)
CREATE TABLE IF NOT EXISTS tenants_backup AS 
SELECT * FROM tenants;

-- Backup Users
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM users;

-- Backup Products
CREATE TABLE IF NOT EXISTS products_backup AS 
SELECT * FROM products;

-- Backup Default Prices
CREATE TABLE IF NOT EXISTS default_prices_backup AS 
SELECT * FROM default_prices;

-- Backup Private Prices
CREATE TABLE IF NOT EXISTS private_prices_backup AS 
SELECT * FROM private_prices;

-- Verify backups
SELECT 
    'tenants_backup' as table_name, COUNT(*) as row_count FROM tenants_backup
UNION ALL
SELECT 'users_backup', COUNT(*) FROM users_backup
UNION ALL
SELECT 'products_backup', COUNT(*) FROM products_backup
UNION ALL
SELECT 'default_prices_backup', COUNT(*) FROM default_prices_backup
UNION ALL
SELECT 'private_prices_backup', COUNT(*) FROM private_prices_backup;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Backup completed successfully. Backup tables created.';
END $$;
