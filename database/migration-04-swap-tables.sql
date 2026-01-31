-- ============================================================================
-- MIGRATION 04: Swap Old Tables with New Tables
-- ============================================================================
-- WARNING: This is a destructive operation. Make sure backups are complete!
-- This renames old tables and promotes new tables to production
-- ============================================================================

-- Step 1: Rename old tables (keep as backup)
ALTER TABLE IF EXISTS users RENAME TO users_old;
ALTER TABLE IF EXISTS products RENAME TO products_old;
ALTER TABLE IF EXISTS tenants RENAME TO tenants_old;

-- Step 2: Rename new tables to production names
ALTER TABLE IF EXISTS users_new RENAME TO users;
ALTER TABLE IF EXISTS products_new RENAME TO products;

-- Step 3: Update table mappings (if using Prisma)
-- The organizations table is already named correctly

-- Step 4: Verify tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE NOTICE '✓ organizations table ready';
    ELSE
        RAISE EXCEPTION 'organizations table not found!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE '✓ users table ready';
    ELSE
        RAISE EXCEPTION 'users table not found!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE NOTICE '✓ products table ready';
    ELSE
        RAISE EXCEPTION 'products table not found!';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Table swap completed successfully.';
    RAISE NOTICE 'Old tables renamed to: users_old, products_old, tenants_old';
    RAISE NOTICE 'New tables are now active: organizations, users, products';
END $$;
