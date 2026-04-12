-- ============================================================================
-- MIGRATION 03: Migrate Data from Old to New Schema
-- ============================================================================
-- This migrates data from old tables to new simplified tables
-- Run this AFTER new schema is created
-- ============================================================================

-- Step 1: Migrate Tenants to Organizations
-- Only migrate active tenants (suppliers and companies, exclude service_provider)
-- Handle both UUID and TEXT id types
INSERT INTO organizations (id, name, type, email, created_at, updated_at)
SELECT 
    CASE 
        -- If id is already UUID, use it directly
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tenants_backup' 
              AND column_name = 'id' 
              AND data_type = 'uuid'
        ) THEN id::uuid
        -- If id is TEXT, generate new UUID (but keep email for matching)
        ELSE gen_random_uuid()
    END as id,
    name,
    CASE 
        WHEN type = 'supplier' THEN 'supplier'::org_type
        WHEN type = 'company' THEN 'company'::org_type
        ELSE NULL  -- Skip service_provider
    END as type,
    email,
    COALESCE(created_at, CURRENT_TIMESTAMP),
    COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM tenants_backup
WHERE type IN ('supplier', 'company')
    AND (status = 'active' OR status IS NULL)  -- Only migrate active tenants
ON CONFLICT (email) DO NOTHING;  -- Use email as conflict key (safer than id)

-- Step 2: Migrate Users to users_new
-- Map old roles to new types
-- Handle both UUID and TEXT id types
INSERT INTO users_new (
    id, 
    organization_id, 
    email, 
    password_hash, 
    name, 
    type, 
    created_at, 
    updated_at
)
SELECT 
    CASE 
        -- If users_backup.id is UUID, use it directly
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users_backup' 
              AND column_name = 'id' 
              AND data_type = 'uuid'
        ) THEN u.id::uuid
        -- If users_backup.id is TEXT, generate new UUID
        ELSE gen_random_uuid()
    END as id,
    -- Match organization_id by email (safer - organizations were created from tenants by email)
    (SELECT o.id FROM organizations o 
     INNER JOIN tenants_backup t ON o.email = t.email 
     WHERE t.id::text = u.tenant_id::text
     LIMIT 1) as organization_id,
    u.email,
    u.password_hash,
    COALESCE(
        CASE 
            WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
            THEN u.first_name || ' ' || u.last_name
            WHEN u.first_name IS NOT NULL THEN u.first_name
            WHEN u.last_name IS NOT NULL THEN u.last_name
            ELSE NULL
        END,
        u.email
    ) as name,
    CASE 
        -- Map company roles to 'qs'
        WHEN u.role IN ('company_admin', 'company_staff') THEN 'qs'
        -- Map supplier roles to 'supplier'
        WHEN u.role IN ('supplier_admin', 'supplier_staff') THEN 'supplier'
        -- Skip super_admin and other roles
        ELSE NULL
    END as type,
    COALESCE(u.created_at, CURRENT_TIMESTAMP),
    COALESCE(u.updated_at, CURRENT_TIMESTAMP)
FROM users_backup u
INNER JOIN tenants_backup t ON t.id::text = COALESCE(u.tenant_id::text, '')
WHERE u.tenant_id IS NOT NULL
    AND (u.status = 'active' OR u.status IS NULL)  -- Only migrate active users
    AND u.role IN ('company_admin', 'company_staff', 'supplier_admin', 'supplier_staff')
    AND t.type IN ('supplier', 'company')
    AND (t.status = 'active' OR t.status IS NULL)
ON CONFLICT (email) DO NOTHING;  -- Use email as conflict key instead of id

-- Step 3: Migrate Products to products_new
-- Only migrate products from suppliers
-- Use default price if available, otherwise use first price found
INSERT INTO products_new (
    id,
    supplier_id,
    name,
    price,
    unit,
    created_at,
    updated_at
)
SELECT DISTINCT ON (p.id::text)
    CASE 
        -- If products_backup.id is UUID, use it directly
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products_backup' 
              AND column_name = 'id' 
              AND data_type = 'uuid'
        ) THEN p.id::uuid
        -- If products_backup.id is TEXT, generate new UUID
        ELSE gen_random_uuid()
    END as id,
    -- Match supplier_id to organization id (cast both to text)
    (SELECT o.id FROM organizations o 
     INNER JOIN tenants_backup t ON o.email = t.email
     WHERE t.id::text = p.supplier_id::text
     LIMIT 1) as supplier_id,
    p.name,
    COALESCE(
        (SELECT dp.price 
         FROM default_prices_backup dp 
         WHERE dp.product_id::text = p.id::text 
           AND dp.is_active = true 
         ORDER BY dp.effective_from DESC 
         LIMIT 1),
        (SELECT pp.price 
         FROM private_prices_backup pp 
         WHERE pp.product_id::text = p.id::text 
           AND pp.is_active = true 
         ORDER BY pp.effective_from DESC 
         LIMIT 1),
        0.00  -- Default if no price found
    ) as price,
    p.unit,
    p.created_at,
    p.updated_at
FROM products_backup p
INNER JOIN organizations o ON (
    -- Match by supplier_id (cast both to text for comparison)
    p.supplier_id::text = o.id::text
)
WHERE p.is_active = true
    AND o.type = 'supplier'
ON CONFLICT (id) DO NOTHING;

-- Verify migration
DO $$
DECLARE
    org_count INTEGER;
    user_count INTEGER;
    product_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO user_count FROM users_new;
    SELECT COUNT(*) INTO product_count FROM products_new;
    
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '  Organizations: %', org_count;
    RAISE NOTICE '  Users: %', user_count;
    RAISE NOTICE '  Products: %', product_count;
END $$;
