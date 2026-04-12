-- ============================================================================
-- RESTORE COEXISTENCE: Make Both Old and New Schemas Available
-- ============================================================================
-- Use this if you've already run migration-04-swap-tables.sql
-- This restores both old and new schemas to coexist
-- ============================================================================

-- Step 1: Rename new tables to *_new (so they don't conflict)
ALTER TABLE IF EXISTS users RENAME TO users_new;
ALTER TABLE IF EXISTS products RENAME TO products_new;
-- organizations stays as is (no conflict)

-- Step 2: Restore old tables to original names
ALTER TABLE IF EXISTS users_old RENAME TO users;
ALTER TABLE IF EXISTS products_old RENAME TO products;
ALTER TABLE IF EXISTS tenants_old RENAME TO tenants;

-- Step 3: Verify both schemas exist
DO $$
BEGIN
    -- Check old schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        RAISE NOTICE '✓ tenants table restored';
    ELSE
        RAISE EXCEPTION 'tenants table not found!';
    END IF;
    
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
    
    -- Check new schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE NOTICE '✓ organizations table exists';
    ELSE
        RAISE EXCEPTION 'organizations table not found!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_new') THEN
        RAISE NOTICE '✓ users_new table exists';
    ELSE
        RAISE EXCEPTION 'users_new table not found!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_new') THEN
        RAISE NOTICE '✓ products_new table exists';
    ELSE
        RAISE EXCEPTION 'products_new table not found!';
    END IF;
END $$;

-- Step 4: Show table counts
DO $$
DECLARE
    old_users_count INTEGER;
    new_users_count INTEGER;
    old_products_count INTEGER;
    new_products_count INTEGER;
    old_tenants_count INTEGER;
    new_orgs_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_users_count FROM users;
    SELECT COUNT(*) INTO new_users_count FROM users_new;
    SELECT COUNT(*) INTO old_products_count FROM products;
    SELECT COUNT(*) INTO new_products_count FROM products_new;
    SELECT COUNT(*) INTO old_tenants_count FROM tenants;
    SELECT COUNT(*) INTO new_orgs_count FROM organizations;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COEXISTENCE RESTORED - Both Schemas Active';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'OLD SCHEMA:';
    RAISE NOTICE '  tenants: % rows', old_tenants_count;
    RAISE NOTICE '  users: % rows', old_users_count;
    RAISE NOTICE '  products: % rows', old_products_count;
    RAISE NOTICE '';
    RAISE NOTICE 'NEW SCHEMA:';
    RAISE NOTICE '  organizations: % rows', new_orgs_count;
    RAISE NOTICE '  users_new: % rows', new_users_count;
    RAISE NOTICE '  products_new: % rows', new_products_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Update Prisma schema to use @@map("users_new") and @@map("products_new")';
    RAISE NOTICE '2. Run: npm run db:generate';
    RAISE NOTICE '3. Restart your application';
    RAISE NOTICE '========================================';
END $$;
