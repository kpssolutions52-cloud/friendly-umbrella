-- Create missing organizations for suppliers
-- This ensures all suppliers in tenants table have corresponding organizations
-- Products are linked to organizations, so this is necessary

-- Step 1: Create organizations for suppliers that don't have them
-- Handle both OrgType (Prisma) and org_type (legacy) enum types
DO $$
BEGIN
    -- Try with OrgType first (Prisma standard)
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgType') THEN
        INSERT INTO organizations (id, name, type, email, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            t.name,
            'supplier'::"OrgType",
            t.email,
            COALESCE(t.created_at, NOW()),
            COALESCE(t.updated_at, NOW())
        FROM tenants t
        WHERE t.type = 'supplier'
          AND t.status = 'active'
          AND NOT EXISTS (
              SELECT 1 
              FROM organizations o 
              WHERE o.email = t.email AND o.type = 'supplier'::"OrgType"
          )
        ON CONFLICT (email) DO NOTHING;
    -- Fallback to org_type if OrgType doesn't exist
    ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_type') THEN
        INSERT INTO organizations (id, name, type, email, created_at, updated_at)
        SELECT 
            gen_random_uuid() as id,
            t.name,
            'supplier'::org_type,
            t.email,
            COALESCE(t.created_at, NOW()),
            COALESCE(t.updated_at, NOW())
        FROM tenants t
        WHERE t.type = 'supplier'
          AND t.status = 'active'
          AND NOT EXISTS (
              SELECT 1 
              FROM organizations o 
              WHERE o.email = t.email AND o.type = 'supplier'::org_type
          )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Step 2: Display summary
SELECT 
    '=== ORGANIZATIONS CREATED ===' as info;

SELECT 
    COUNT(*) as "Organizations Created",
    (SELECT COUNT(*) FROM organizations WHERE type = 'supplier') as "Total Supplier Organizations"
FROM organizations
WHERE type = 'supplier'
  AND created_at >= NOW() - INTERVAL '1 minute';
