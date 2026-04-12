-- ============================================================================
-- Quick Fix: Add organization_id column (TEMPORARY WORKAROUND)
-- ============================================================================
-- ⚠️ WARNING: This is a temporary workaround!
-- Better solution: Run full migration (migration-01 through migration-04)
-- ============================================================================
-- This script adds organization_id column to existing users table
-- Only use if you can't run full migration right now
-- ============================================================================

-- Step 1: Check if we need to fix
DO $$
DECLARE
    has_tenant_id BOOLEAN;
    has_organization_id BOOLEAN;
    has_organizations BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tenant_id'
    ) INTO has_tenant_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
    ) INTO has_organization_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organizations'
    ) INTO has_organizations;
    
    IF has_tenant_id AND NOT has_organization_id THEN
        RAISE NOTICE '⚠️  Old schema detected. Need to migrate.';
        RAISE NOTICE 'Recommended: Run full migration scripts';
        RAISE NOTICE 'Quick fix: This script will add organization_id column';
    ELSIF has_organization_id THEN
        RAISE NOTICE '✅ Already has organization_id - no fix needed!';
    ELSE
        RAISE NOTICE '⚠️  Unknown state - check your database';
    END IF;
END $$;

-- Step 2: Create org_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_type') THEN
        CREATE TYPE org_type AS ENUM ('company', 'supplier');
    END IF;
END $$;

-- Step 2b: Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type org_type NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

-- Step 3: Migrate tenants to organizations (if tenants table exists)
DO $$
DECLARE
    tenant_id_type TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        -- Check tenants.id data type
        SELECT data_type INTO tenant_id_type
        FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'id';
        
        IF tenant_id_type = 'uuid' THEN
            -- tenants.id is UUID - use it directly
            INSERT INTO organizations (id, name, type, email, created_at, updated_at)
            SELECT 
                id,
                name,
                CASE 
                    WHEN type = 'supplier' THEN 'supplier'::org_type
                    WHEN type = 'company' THEN 'company'::org_type
                    ELSE NULL
                END as type,
                email,
                COALESCE(created_at, CURRENT_TIMESTAMP),
                COALESCE(updated_at, CURRENT_TIMESTAMP)
            FROM tenants
            WHERE type IN ('supplier', 'company')
              AND (status = 'active' OR status IS NULL)
            ON CONFLICT (email) DO NOTHING;
            
            RAISE NOTICE 'Migrated tenants to organizations (UUID ids)';
        ELSE
            -- tenants.id is TEXT/VARCHAR - generate new UUIDs, match by email
            INSERT INTO organizations (id, name, type, email, created_at, updated_at)
            SELECT 
                gen_random_uuid(),  -- Generate new UUID
                name,
                CASE 
                    WHEN type = 'supplier' THEN 'supplier'::org_type
                    WHEN type = 'company' THEN 'company'::org_type
                    ELSE NULL
                END as type,
                email,
                COALESCE(created_at, CURRENT_TIMESTAMP),
                COALESCE(updated_at, CURRENT_TIMESTAMP)
            FROM tenants
            WHERE type IN ('supplier', 'company')
              AND (status = 'active' OR status IS NULL)
            ON CONFLICT (email) DO NOTHING;  -- Use email as conflict key
            
            RAISE NOTICE 'Migrated tenants to organizations (generated new UUIDs, matched by email)';
        END IF;
    END IF;
END $$;

-- Step 4: Add organization_id column to users (if it doesn't exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tenant_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
    ) THEN
        -- Add organization_id column
        ALTER TABLE users 
        ADD COLUMN organization_id UUID;
        
        -- Copy tenant_id to organization_id (handle type conversion)
        UPDATE users u
        SET organization_id = (
            SELECT o.id 
            FROM organizations o
            WHERE o.email = (
                SELECT t.email 
                FROM tenants t 
                WHERE t.id::text = u.tenant_id::text
                LIMIT 1
            )
            LIMIT 1
        )
        WHERE tenant_id IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM tenants t 
              WHERE t.id::text = u.tenant_id::text
          );
        
        -- Add foreign key constraint
        ALTER TABLE users
        ADD CONSTRAINT fk_users_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Add index
        CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
        
        RAISE NOTICE '✅ Added organization_id column and migrated data';
    ELSE
        RAISE NOTICE 'organization_id column already exists or tenant_id not found';
    END IF;
END $$;

-- Step 5: Add type column to users (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'type'
    ) THEN
        -- Add type column
        ALTER TABLE users 
        ADD COLUMN type VARCHAR(20);
        
        -- Set type based on role
        UPDATE users 
        SET type = CASE 
            WHEN role IN ('company_admin', 'company_staff') THEN 'qs'
            WHEN role IN ('supplier_admin', 'supplier_staff') THEN 'supplier'
            ELSE NULL
        END;
        
        -- Add constraint
        ALTER TABLE users
        ADD CONSTRAINT chk_users_type 
        CHECK (type IN ('qs', 'supplier'));
        
        -- Add index
        CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
        
        RAISE NOTICE '✅ Added type column to users';
    ELSE
        RAISE NOTICE 'type column already exists';
    END IF;
END $$;

-- Step 6: Verify fix
DO $$
DECLARE
    org_count INTEGER;
    user_count INTEGER;
    users_with_org_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO users_with_org_id FROM users WHERE organization_id IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Verification ===';
    RAISE NOTICE 'Organizations: %', org_count;
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Users with organization_id: %', users_with_org_id;
    
    IF users_with_org_id > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Fix applied! Now run: cd packages/backend && npx prisma generate';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  No users with organization_id found. Check your data.';
    END IF;
END $$;
