-- Create missing organizations for suppliers
-- This ensures all suppliers in tenants table have corresponding organizations
-- Products are linked to organizations, so this is necessary

-- Step 1: Create organizations for suppliers that don't have them
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
      WHERE o.email = t.email AND o.type = 'supplier'
  )
ON CONFLICT (email) DO NOTHING;

-- Step 2: Display summary
SELECT 
    '=== ORGANIZATIONS CREATED ===' as info;

SELECT 
    COUNT(*) as "Organizations Created",
    (SELECT COUNT(*) FROM organizations WHERE type = 'supplier') as "Total Supplier Organizations"
FROM organizations
WHERE type = 'supplier'
  AND created_at >= NOW() - INTERVAL '1 minute';
