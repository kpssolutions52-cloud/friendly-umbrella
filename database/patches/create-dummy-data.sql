-- Create comprehensive dummy data for suppliers, products, and contact details
-- This script populates the dashboard with realistic test data

-- Step 1: Ensure OrgType enum exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgType') THEN
        CREATE TYPE "OrgType" AS ENUM ('company', 'supplier');
        RAISE NOTICE 'Created OrgType enum';
    END IF;
END $$;

-- Step 2: Ensure UserType enum exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserType') THEN
        CREATE TYPE "UserType" AS ENUM ('qs', 'supplier');
        RAISE NOTICE 'Created UserType enum';
    END IF;
END $$;

-- Step 3: Ensure UserRole enum exists (for old schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('super_admin', 'supplier_admin', 'supplier_staff', 'company_admin', 'company_staff');
        RAISE NOTICE 'Created UserRole enum';
    END IF;
END $$;

-- Step 4: Create multiple supplier organizations with contact users and products
DO $$
DECLARE
    supplier1_id UUID;
    supplier2_id UUID;
    supplier3_id UUID;
    supplier4_id UUID;
    supplier5_id UUID;
BEGIN
    -- Supplier 1: ABC Construction Materials
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'ABC Construction Materials Ltd',
        'supplier'::"OrgType",
        'info@abcconstruction.com',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO supplier1_id;

    IF supplier1_id IS NULL THEN
        SELECT id INTO supplier1_id FROM organizations WHERE email = 'info@abcconstruction.com';
    END IF;

    -- Create contact users for Supplier 1 (with role, status, is_active)
    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier1_id,
        'john.smith@abcconstruction.com',
        '$2a$12$dummyhash',
        'John Smith',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier1_id,
        'sales@abcconstruction.com',
        '$2a$12$dummyhash',
        'Sales Team',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    -- Products for Supplier 1
    INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
    VALUES
        (gen_random_uuid(), supplier1_id, 'Portland Cement 50kg', 'ABC-CEMENT-50KG', 45.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), supplier1_id, 'Steel Rebar 12mm', 'ABC-STEEL-12MM', 850.00, 'TON', NOW(), NOW()),
        (gen_random_uuid(), supplier1_id, 'Steel Rebar 16mm', 'ABC-STEEL-16MM', 870.00, 'TON', NOW(), NOW()),
        (gen_random_uuid(), supplier1_id, 'River Sand', 'ABC-SAND-RIVER', 35.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier1_id, 'Crushed Stone 20mm', 'ABC-STONE-20MM', 40.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier1_id, 'Concrete Blocks', 'ABC-BLOCK-STD', 2.50, 'PIECE', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created Supplier 1: ABC Construction Materials';

    -- Supplier 2: XYZ Building Supplies
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'XYZ Building Supplies Inc',
        'supplier'::"OrgType",
        'contact@xyzbuilding.com',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO supplier2_id;

    IF supplier2_id IS NULL THEN
        SELECT id INTO supplier2_id FROM organizations WHERE email = 'contact@xyzbuilding.com';
    END IF;

    -- Create contact users for Supplier 2
    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier2_id,
        'michael.jones@xyzbuilding.com',
        '$2a$12$dummyhash',
        'Michael Jones',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier2_id,
        'info@xyzbuilding.com',
        '$2a$12$dummyhash',
        'Info Desk',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    -- Products for Supplier 2
    INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
    VALUES
        (gen_random_uuid(), supplier2_id, 'Cement OPC 50kg', 'XYZ-CEMENT-OPC-50', 48.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), supplier2_id, 'Cement OPC 25kg', 'XYZ-CEMENT-OPC-25', 25.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), supplier2_id, 'Steel Reinforcement 10mm', 'XYZ-STEEL-10MM', 820.00, 'TON', NOW(), NOW()),
        (gen_random_uuid(), supplier2_id, 'Steel Reinforcement 20mm', 'XYZ-STEEL-20MM', 880.00, 'TON', NOW(), NOW()),
        (gen_random_uuid(), supplier2_id, 'Fine Sand', 'XYZ-SAND-FINE', 32.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier2_id, 'Coarse Sand', 'XYZ-SAND-COARSE', 30.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier2_id, 'Gravel 10mm', 'XYZ-GRAVEL-10MM', 38.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier2_id, 'Clay Bricks', 'XYZ-BRICK-CLAY', 0.35, 'PIECE', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created Supplier 2: XYZ Building Supplies';

    -- Supplier 3: Premium Materials Co
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Premium Materials Company',
        'supplier'::"OrgType",
        'sales@premiummaterials.com',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO supplier3_id;

    IF supplier3_id IS NULL THEN
        SELECT id INTO supplier3_id FROM organizations WHERE email = 'sales@premiummaterials.com';
    END IF;

    -- Create contact users for Supplier 3
    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier3_id,
        'sarah.williams@premiummaterials.com',
        '$2a$12$dummyhash',
        'Sarah Williams',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier3_id,
        'quotes@premiummaterials.com',
        '$2a$12$dummyhash',
        'Quotations Team',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    -- Products for Supplier 3
    INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
    VALUES
        (gen_random_uuid(), supplier3_id, 'Premium Cement 50kg', 'PMC-CEMENT-PREM-50', 52.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), supplier3_id, 'High Grade Steel Rebar', 'PMC-STEEL-HG', 920.00, 'TON', NOW(), NOW()),
        (gen_random_uuid(), supplier3_id, 'Premium Sand', 'PMC-SAND-PREM', 42.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier3_id, 'Decorative Tiles', 'PMC-TILE-DEC', 25.00, 'SQ_M', NOW(), NOW()),
        (gen_random_uuid(), supplier3_id, 'Ceramic Tiles', 'PMC-TILE-CER', 18.00, 'SQ_M', NOW(), NOW()),
        (gen_random_uuid(), supplier3_id, 'Paint Premium', 'PMC-PAINT-PREM', 45.00, 'LITER', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created Supplier 3: Premium Materials Company';

    -- Supplier 4: Global Construction Supplies
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Global Construction Supplies',
        'supplier'::"OrgType",
        'info@globalconstruction.com',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO supplier4_id;

    IF supplier4_id IS NULL THEN
        SELECT id INTO supplier4_id FROM organizations WHERE email = 'info@globalconstruction.com';
    END IF;

    -- Create contact users for Supplier 4
    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier4_id,
        'david.brown@globalconstruction.com',
        '$2a$12$dummyhash',
        'David Brown',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier4_id,
        'support@globalconstruction.com',
        '$2a$12$dummyhash',
        'Support Team',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    -- Products for Supplier 4
    INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
    VALUES
        (gen_random_uuid(), supplier4_id, 'Cement Type I', 'GCS-CEMENT-T1', 46.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), supplier4_id, 'Cement Type II', 'GCS-CEMENT-T2', 49.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), supplier4_id, 'Steel Wire Mesh', 'GCS-STEEL-MESH', 12.00, 'SQ_M', NOW(), NOW()),
        (gen_random_uuid(), supplier4_id, 'Ready Mix Concrete', 'GCS-CONCRETE-RMC', 120.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier4_id, 'Plaster Sand', 'GCS-SAND-PLASTER', 36.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier4_id, 'Roofing Tiles', 'GCS-ROOF-TILE', 8.50, 'PIECE', NOW(), NOW()),
        (gen_random_uuid(), supplier4_id, 'PVC Pipes', 'GCS-PIPE-PVC', 15.00, 'METER', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created Supplier 4: Global Construction Supplies';

    -- Supplier 5: Best Value Materials
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Best Value Materials',
        'supplier'::"OrgType",
        'contact@bestvaluematerials.com',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO supplier5_id;

    IF supplier5_id IS NULL THEN
        SELECT id INTO supplier5_id FROM organizations WHERE email = 'contact@bestvaluematerials.com';
    END IF;

    -- Create contact users for Supplier 5
    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier5_id,
        'lisa.anderson@bestvaluematerials.com',
        '$2a$12$dummyhash',
        'Lisa Anderson',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        supplier5_id,
        'orders@bestvaluematerials.com',
        '$2a$12$dummyhash',
        'Orders Department',
        'supplier'::"UserType",
        'supplier_staff'::"UserRole",
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        role = CASE WHEN EXCLUDED.role IS NOT NULL THEN EXCLUDED.role ELSE COALESCE(users.role, 'supplier_staff'::"UserRole") END,
        status = CASE WHEN EXCLUDED.status IS NOT NULL THEN EXCLUDED.status ELSE COALESCE(users.status, 'active') END,
        is_active = CASE WHEN EXCLUDED.is_active IS NOT NULL THEN EXCLUDED.is_active ELSE COALESCE(users.is_active, true) END;

    -- Products for Supplier 5
    INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
    VALUES
        (gen_random_uuid(), supplier5_id, 'Economy Cement 50kg', 'BVM-CEMENT-ECO-50', 42.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), supplier5_id, 'Standard Steel Rebar', 'BVM-STEEL-STD', 830.00, 'TON', NOW(), NOW()),
        (gen_random_uuid(), supplier5_id, 'Building Sand', 'BVM-SAND-BUILD', 28.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier5_id, 'Aggregate 20mm', 'BVM-AGG-20MM', 35.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), supplier5_id, 'Hollow Blocks', 'BVM-BLOCK-HOLLOW', 3.20, 'PIECE', NOW(), NOW()),
        (gen_random_uuid(), supplier5_id, 'Standard Paint', 'BVM-PAINT-STD', 28.00, 'LITER', NOW(), NOW()),
        (gen_random_uuid(), supplier5_id, 'Wood Planks', 'BVM-WOOD-PLANK', 12.00, 'METER', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created Supplier 5: Best Value Materials';

END $$;

-- Step 5: Display summary of created data
SELECT 
    '=== SUPPLIERS SUMMARY ===' as summary;

SELECT 
    o.id,
    o.name as supplier_name,
    o.email as supplier_email,
    COUNT(DISTINCT u.id) as contact_users,
    COUNT(DISTINCT p.id) as product_count
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id AND u.type = 'supplier'
LEFT JOIN products p ON p.supplier_id = o.id
WHERE o.type = 'supplier'
GROUP BY o.id, o.name, o.email
ORDER BY o.name;

-- Step 6: Display contact users for each supplier
SELECT 
    '=== CONTACT USERS ===' as summary;

SELECT 
    o.name as supplier_name,
    u.name as contact_name,
    u.email as contact_email
FROM organizations o
JOIN users u ON u.organization_id = o.id
WHERE o.type = 'supplier' AND u.type = 'supplier'
ORDER BY o.name, u.name;

-- Step 7: Display products by supplier
SELECT 
    '=== PRODUCTS BY SUPPLIER ===' as summary;

SELECT 
    o.name as supplier_name,
    p.name as product_name,
    p.sku,
    p.price,
    p.unit
FROM organizations o
JOIN products p ON p.supplier_id = o.id
WHERE o.type = 'supplier'
ORDER BY o.name, p.name;

-- Step 8: Final summary
SELECT 
    '=== FINAL SUMMARY ===' as summary,
    (SELECT COUNT(*) FROM organizations WHERE type = 'supplier') as total_suppliers,
    (SELECT COUNT(*) FROM users WHERE type = 'supplier') as total_contact_users,
    (SELECT COUNT(*) FROM products) as total_products;
