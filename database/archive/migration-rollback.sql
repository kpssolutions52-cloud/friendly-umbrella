-- ============================================================================
-- ROLLBACK: Restore Previous Schema
-- ============================================================================
-- Use this if you need to rollback to the previous schema
-- This restores the old table names
-- ============================================================================

-- Step 1: Rename new tables back
ALTER TABLE IF EXISTS users RENAME TO users_new;
ALTER TABLE IF EXISTS products RENAME TO products_new;
ALTER TABLE IF EXISTS organizations RENAME TO organizations_new;

-- Step 2: Restore old tables
ALTER TABLE IF EXISTS users_old RENAME TO users;
ALTER TABLE IF EXISTS products_old RENAME TO products;
ALTER TABLE IF EXISTS tenants_old RENAME TO tenants;

-- Step 3: Verify restoration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE '✓ users table restored';
    ELSE
        RAISE EXCEPTION 'users table not found!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE NOTICE '✓ products table restored';
    ELSE
        RAISE EXCEPTION 'products table not found!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE NOTICE '✓ tenants table restored';
    ELSE
        RAISE EXCEPTION 'tenants table not found!';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Rollback completed. Old schema restored.';
    RAISE NOTICE 'You may need to restart your application.';
END $$;
