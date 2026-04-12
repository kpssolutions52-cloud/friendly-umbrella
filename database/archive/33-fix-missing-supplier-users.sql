-- Fix Missing Supplier Users
-- This script creates user accounts for all suppliers that don't have users
-- Run this if you get "No user found for supplier" errors
--
-- IMPORTANT: Run database/32-create-missing-organizations-for-suppliers.sql first
-- to ensure organizations exist for all suppliers

-- Step 1: Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1.5: Ensure UserRole enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('super_admin', 'supplier_admin', 'supplier_staff', 'company_admin', 'company_staff');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'rejected', 'inactive');
    END IF;
END $$;

-- Step 2: Diagnostic - Find suppliers (organizations) without users
SELECT 
    '=== DIAGNOSTIC: Suppliers Without Users ===' as info;

SELECT 
    o.id as organization_id,
    o.name as supplier_name,
    o.email as supplier_email,
    COUNT(u.id) as user_count
FROM organizations o
LEFT JOIN users u ON (
    (u.organization_id = o.id) OR 
    (u.tenant_id IN (SELECT id FROM tenants WHERE email = o.email))
)
WHERE o.type::text = 'supplier'
GROUP BY o.id, o.name, o.email
HAVING COUNT(u.id) = 0
ORDER BY o.name;

-- Step 2.5: Create tenants for organizations that don't have them (if tenants table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        INSERT INTO tenants (id, name, type, email, status, is_active, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            o.name,
            'supplier'::"TenantType" as type,
            o.email,
            'active'::"TenantStatus" as status,
            true as is_active,
            COALESCE(o.created_at, NOW()) as created_at,
            COALESCE(o.updated_at, NOW()) as updated_at
        FROM organizations o
        WHERE o.type::text = 'supplier'
          AND NOT EXISTS (
              SELECT 1 FROM tenants t WHERE t.email = o.email AND t.type = 'supplier'
          )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Step 3: Create missing user accounts for all suppliers
-- Check which schema is in use and create users accordingly

DO $$
BEGIN
    -- Try organization_id first (new schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        INSERT INTO users (
            id, organization_id, email, password_hash, first_name, last_name, 
            role, status, is_active, type, created_at, updated_at
        )
        SELECT 
            gen_random_uuid() as id,
            o.id as organization_id,
            o.email,
            crypt('Demo123!', gen_salt('bf', 12)) as password_hash,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN LEFT(o.name, position(' ' in o.name) - 1)
                ELSE LEFT(o.name, 20)
            END as first_name,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN SUBSTRING(o.name from position(' ' in o.name) + 1)
                ELSE ''
            END as last_name,
            'supplier_admin'::"UserRole" as role,
            'active'::"UserStatus" as status,
            true as is_active,
            'supplier'::"UserType" as type,
            NOW() as created_at,
            NOW() as updated_at
        FROM organizations o
        WHERE o.type::text = 'supplier'
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type')
          AND NOT EXISTS (
              SELECT 1 FROM users u 
              WHERE u.organization_id = o.id OR u.email = o.email
          );
        
        -- Also insert without type if type column doesn't exist
        INSERT INTO users (
            id, organization_id, email, password_hash, first_name, last_name, 
            role, status, is_active, created_at, updated_at
        )
        SELECT 
            gen_random_uuid() as id,
            o.id as organization_id,
            o.email,
            crypt('Demo123!', gen_salt('bf', 12)) as password_hash,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN LEFT(o.name, position(' ' in o.name) - 1)
                ELSE LEFT(o.name, 20)
            END as first_name,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN SUBSTRING(o.name from position(' ' in o.name) + 1)
                ELSE ''
            END as last_name,
            'supplier_admin'::"UserRole" as role,
            'active'::"UserStatus" as status,
            true as is_active,
            NOW() as created_at,
            NOW() as updated_at
        FROM organizations o
        WHERE o.type::text = 'supplier'
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type')
          AND NOT EXISTS (
              SELECT 1 FROM users u 
              WHERE u.organization_id = o.id OR u.email = o.email
          );
        
        -- Update existing users that might be missing organization_id, type, or have wrong role
        UPDATE users u
        SET 
            organization_id = o.id,
            password_hash = crypt('Demo123!', gen_salt('bf', 12)),
            role = COALESCE(u.role, 'supplier_admin'::"UserRole"),
            status = COALESCE(u.status, 'active'::"UserStatus"),
            is_active = COALESCE(u.is_active, true),
            type = CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type')
                THEN 'supplier'::"UserType"
                ELSE u.type
            END,
            updated_at = NOW()
        FROM organizations o
        WHERE o.type::text = 'supplier'
          AND u.email = o.email
          AND (u.organization_id IS NULL OR u.organization_id != o.id OR u.role IS NULL 
               OR (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type') 
                   AND (u.type IS NULL OR u.type != 'supplier'::"UserType")));
    END IF;
    
    -- Try tenant_id (old schema) if organization_id column doesn't exist or for missing users
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
        INSERT INTO users (
            id, tenant_id, email, password_hash, first_name, last_name, 
            role, status, is_active, type, created_at, updated_at
        )
        SELECT 
            gen_random_uuid() as id,
            t.id as tenant_id,
            o.email,
            crypt('Demo123!', gen_salt('bf', 12)) as password_hash,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN LEFT(o.name, position(' ' in o.name) - 1)
                ELSE LEFT(o.name, 20)
            END as first_name,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN SUBSTRING(o.name from position(' ' in o.name) + 1)
                ELSE ''
            END as last_name,
            'supplier_admin'::"UserRole" as role,
            'active'::"UserStatus" as status,
            true as is_active,
            'supplier'::"UserType" as type,
            NOW() as created_at,
            NOW() as updated_at
        FROM organizations o
        LEFT JOIN tenants t ON t.email = o.email AND t.type = 'supplier' AND t.status = 'active'
        WHERE o.type::text = 'supplier'
          AND t.id IS NOT NULL
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type')
          AND NOT EXISTS (
              SELECT 1 FROM users u 
              WHERE u.tenant_id = t.id OR u.email = o.email
          );
        
        -- Also insert without type if type column doesn't exist
        INSERT INTO users (
            id, tenant_id, email, password_hash, first_name, last_name, 
            role, status, is_active, created_at, updated_at
        )
        SELECT 
            gen_random_uuid() as id,
            t.id as tenant_id,
            o.email,
            crypt('Demo123!', gen_salt('bf', 12)) as password_hash,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN LEFT(o.name, position(' ' in o.name) - 1)
                ELSE LEFT(o.name, 20)
            END as first_name,
            CASE 
                WHEN position(' ' in o.name) > 0 THEN SUBSTRING(o.name from position(' ' in o.name) + 1)
                ELSE ''
            END as last_name,
            'supplier_admin'::"UserRole" as role,
            'active'::"UserStatus" as status,
            true as is_active,
            NOW() as created_at,
            NOW() as updated_at
        FROM organizations o
        LEFT JOIN tenants t ON t.email = o.email AND t.type = 'supplier' AND t.status = 'active'
        WHERE o.type::text = 'supplier'
          AND t.id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type')
          AND NOT EXISTS (
              SELECT 1 FROM users u 
              WHERE u.tenant_id = t.id OR u.email = o.email
          );
        
        -- Update existing users that might be missing tenant_id or have wrong role
        UPDATE users u
        SET 
            tenant_id = t.id,
            password_hash = crypt('Demo123!', gen_salt('bf', 12)),
            role = COALESCE(u.role, 'supplier_admin'::"UserRole"),
            status = COALESCE(u.status, 'active'::"UserStatus"),
            is_active = COALESCE(u.is_active, true),
            updated_at = NOW()
        FROM organizations o
        LEFT JOIN tenants t ON t.email = o.email AND t.type = 'supplier' AND t.status = 'active'
        WHERE o.type::text = 'supplier'
          AND t.id IS NOT NULL
          AND u.email = o.email
          AND (u.tenant_id IS NULL OR u.tenant_id != t.id OR u.role IS NULL);
    END IF;
    
    -- Update type column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'type') THEN
        UPDATE users u
        SET type = 'supplier'::"UserType"
        WHERE (
            EXISTS (
                SELECT 1 FROM organizations o 
                WHERE o.id = u.organization_id AND o.type::text = 'supplier'
            )
            OR EXISTS (
                SELECT 1 FROM tenants t 
                WHERE t.id = u.tenant_id AND t.type = 'supplier'
            )
        )
        AND (u.type IS NULL OR u.type != 'supplier'::"UserType");
    END IF;
END $$;

-- Step 4: Verify all suppliers now have users
SELECT 
    '=== VERIFICATION: Suppliers with Users ===' as info;

-- Check users linked via organization_id
SELECT 
    o.name as supplier_name,
    o.email as supplier_email,
    u.email as user_email,
    u.first_name,
    u.last_name,
    u.role,
    u.status as user_status,
    u.is_active,
    'via organization_id' as link_type
FROM organizations o
JOIN users u ON o.id = u.organization_id
WHERE o.type::text = 'supplier'

UNION ALL

-- Check users linked via tenant_id (if tenants table exists)
SELECT 
    o.name as supplier_name,
    o.email as supplier_email,
    u.email as user_email,
    u.first_name,
    u.last_name,
    u.role,
    u.status as user_status,
    u.is_active,
    'via tenant_id' as link_type
FROM organizations o
JOIN tenants t ON t.email = o.email AND t.type = 'supplier'
JOIN users u ON u.tenant_id = t.id
WHERE o.type::text = 'supplier'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants')
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.organization_id = o.id)

ORDER BY supplier_name;

-- Step 5: Summary
SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    (SELECT COUNT(*) FROM organizations WHERE type::text = 'supplier') as "Total Supplier Organizations",
    (SELECT COUNT(DISTINCT o.id) FROM organizations o
     LEFT JOIN users u1 ON u1.organization_id = o.id
     LEFT JOIN tenants t ON t.email = o.email AND t.type = 'supplier'
     LEFT JOIN users u2 ON u2.tenant_id = t.id
     WHERE o.type::text = 'supplier'
       AND (u1.id IS NOT NULL OR u2.id IS NOT NULL)
    ) as "Suppliers with Users",
    (SELECT COUNT(*) FROM organizations o
     WHERE o.type::text = 'supplier'
       AND NOT EXISTS (
           SELECT 1 FROM users u1 WHERE u1.organization_id = o.id
       )
       AND NOT EXISTS (
           SELECT 1 FROM tenants t 
           JOIN users u2 ON u2.tenant_id = t.id
           WHERE t.email = o.email AND t.type = 'supplier'
       )
    ) as "Suppliers without Users",
    (SELECT COUNT(*) FROM organizations o
     WHERE o.type::text = 'supplier'
       AND NOT EXISTS (
           SELECT 1 FROM tenants t WHERE t.email = o.email AND t.type = 'supplier'
       )
    ) as "Organizations without Tenants";
