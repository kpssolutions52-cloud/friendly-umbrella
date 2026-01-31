-- ============================================================================
-- Fix: column "organization_id" does not exist
-- ============================================================================
-- This error means your database still has the old schema (tenant_id)
-- This script helps diagnose and provides options to fix
-- ============================================================================

-- Step 1: Check current schema
DO $$
DECLARE
    has_tenant_id BOOLEAN;
    has_organization_id BOOLEAN;
    has_organizations_table BOOLEAN;
    has_tenants_table BOOLEAN;
BEGIN
    -- Check if users table has tenant_id (old schema)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tenant_id'
    ) INTO has_tenant_id;
    
    -- Check if users table has organization_id (new schema)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
    ) INTO has_organization_id;
    
    -- Check if organizations table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organizations'
    ) INTO has_organizations_table;
    
    -- Check if tenants table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tenants'
    ) INTO has_tenants_table;
    
    RAISE NOTICE '=== Database Schema Status ===';
    RAISE NOTICE 'Users table has tenant_id (old): %', has_tenant_id;
    RAISE NOTICE 'Users table has organization_id (new): %', has_organization_id;
    RAISE NOTICE 'Organizations table exists: %', has_organizations_table;
    RAISE NOTICE 'Tenants table exists: %', has_tenants_table;
    
    IF has_tenant_id AND NOT has_organization_id THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ISSUE DETECTED: Database has old schema!';
        RAISE NOTICE 'Solution: Run migration scripts or mvp1-setup.sql';
    ELSIF has_organization_id AND has_organizations_table THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Database has new schema - should work!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Mixed state detected - may need manual fix';
    END IF;
END $$;

-- Step 2: Show current users table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Step 3: If you need to migrate from old to new schema
-- (Only run this if you have old schema and want to migrate)

-- Option A: If you have old schema and want to add new columns temporarily
-- (This is a workaround - better to run full migration)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tenant_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
    ) THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Old schema detected. You need to:';
        RAISE NOTICE '1. Run: database/migration-01-backup-existing-data.sql (backup)';
        RAISE NOTICE '2. Run: database/migration-02-create-new-schema.sql (create new tables)';
        RAISE NOTICE '3. Run: database/migration-03-migrate-data.sql (migrate data)';
        RAISE NOTICE '4. Run: database/migration-04-swap-tables.sql (swap tables)';
        RAISE NOTICE '';
        RAISE NOTICE 'OR for fresh start:';
        RAISE NOTICE '1. Run: database/mvp1-setup.sql';
    END IF;
END $$;
