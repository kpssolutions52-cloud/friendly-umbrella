-- ============================================================================
-- Check Current Database State
-- ============================================================================
-- Run this to see what tables exist in your database
-- Helps determine if you need to migrate or start fresh
-- ============================================================================

-- Check if old tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as tenants_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as users_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as products_table;

-- Check if new tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as organizations_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'type'
        )) 
        THEN 'EXISTS (NEW STRUCTURE)' 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'EXISTS (OLD STRUCTURE)' 
        ELSE 'NOT FOUND' 
    END as users_table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'supplier_id'
        )) 
        THEN 'EXISTS (NEW STRUCTURE)' 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
        THEN 'EXISTS (OLD STRUCTURE)' 
        ELSE 'NOT FOUND' 
    END as products_table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_prices') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as company_prices_table;

-- Check if backup tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants_backup') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as tenants_backup,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as users_backup,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_backup') 
        THEN 'EXISTS' 
        ELSE 'NOT FOUND' 
    END as products_backup;

-- Count records in existing tables (if they exist)
DO $$
DECLARE
    tenants_count INTEGER := 0;
    users_count INTEGER := 0;
    products_count INTEGER := 0;
    organizations_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        SELECT COUNT(*) INTO tenants_count FROM tenants;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        SELECT COUNT(*) INTO users_count FROM users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        SELECT COUNT(*) INTO products_count FROM products;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        SELECT COUNT(*) INTO organizations_count FROM organizations;
    END IF;
    
    RAISE NOTICE 'Current Data Counts:';
    RAISE NOTICE '  Tenants: %', tenants_count;
    RAISE NOTICE '  Users: %', users_count;
    RAISE NOTICE '  Products: %', products_count;
    RAISE NOTICE '  Organizations: %', organizations_count;
END $$;
