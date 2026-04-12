-- Create demo products for the demo supplier
-- This ensures the chat has real data to query instead of making up fake data

-- Step 1: Get the demo supplier organization ID
DO $$
DECLARE
    demo_supplier_id UUID;
BEGIN
    -- Get demo supplier organization ID
    SELECT id INTO demo_supplier_id
    FROM organizations
    WHERE email = 'demo-supplier@constructionguru.com'
       OR name = 'Demo Supplier Organization'
    LIMIT 1;

    IF demo_supplier_id IS NULL THEN
        RAISE EXCEPTION 'Demo supplier organization not found. Please run fix-demo-accounts-simple.sql first.';
    END IF;

    RAISE NOTICE 'Found demo supplier organization: %', demo_supplier_id;

    -- Step 2: Insert demo cement products
    INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
    VALUES
        (gen_random_uuid(), demo_supplier_id, 'CEMENT 50Kg VOC', 'CEMENT-50KG-VOC-001', 0.01, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'Cement 25Kg', 'CEMENT-25KG-001', 0.01, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'CEMENT OSS 50 Kg', 'CEMENT-OSS-50KG-001', 0.01, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'Cement', 'CEMENT-GENERIC-001', 0.01, 'Packet', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Inserted demo cement products';

    -- Step 3: Insert additional demo products
    INSERT INTO products (id, supplier_id, name, sku, price, unit, created_at, updated_at)
    VALUES
        (gen_random_uuid(), demo_supplier_id, 'Steel Reinforcement Bar', 'STEEL-RB-001', 100.00, 'TON', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'Portland Cement', 'CEMENT-PORTLAND-001', 50.00, 'BAG', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'Sand', 'SAND-001', 30.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'Gravel', 'GRAVEL-001', 35.00, 'M3', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'Concrete Blocks', 'BLOCK-001', 2.50, 'PIECE', NOW(), NOW()),
        (gen_random_uuid(), demo_supplier_id, 'Rebar 12mm', 'REBAR-12MM-001', 800.00, 'TON', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Inserted additional demo products';

    -- Step 4: Verify products were created
    RAISE NOTICE 'Total products for demo supplier: %', (
        SELECT COUNT(*) FROM products WHERE supplier_id = demo_supplier_id
    );

END $$;

-- Step 5: Show all products for demo supplier
SELECT 
    p.id,
    p.name,
    p.sku,
    p.price,
    p.unit,
    o.name as supplier_name,
    o.email as supplier_email
FROM products p
JOIN organizations o ON p.supplier_id = o.id
WHERE o.email = 'demo-supplier@constructionguru.com'
   OR o.name = 'Demo Supplier Organization'
ORDER BY p.name;
