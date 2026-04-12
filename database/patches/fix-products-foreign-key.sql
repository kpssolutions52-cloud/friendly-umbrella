-- Fix products table foreign key constraint
-- This script checks and fixes the foreign key constraint on products.supplier_id

-- Step 1: Check current foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'supplier_id';

-- Step 2: Drop the existing foreign key constraint if it exists and is wrong
-- (Uncomment if needed - be careful!)
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_supplier_id_fkey'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_supplier_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;
*/

-- Step 3: Create the correct foreign key constraint pointing to organizations table
-- (Uncomment if you need to recreate the constraint)
/*
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_supplier_id_fkey'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT products_supplier_id_fkey
        FOREIGN KEY (supplier_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Created foreign key constraint: products_supplier_id -> organizations.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;
*/

-- Step 4: Verify the constraint is correct
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name = 'organizations' AND ccu.column_name = 'id' THEN '✅ CORRECT'
        ELSE '❌ WRONG - Points to ' || ccu.table_name || '.' || ccu.column_name
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'supplier_id';

-- Step 5: Test if we can create a product with the demo supplier organization
SELECT 
    'Testing product creation...' as test,
    o.id as supplier_id,
    o.name as supplier_name,
    o.type as supplier_type,
    CASE 
        WHEN o.type = 'supplier' THEN '✅ Can create products'
        ELSE '❌ Cannot create products (not a supplier)'
    END as can_create
FROM organizations o
WHERE o.email = 'demo-supplier@constructionguru.com'
   OR o.name = 'Demo Supplier Organization';
