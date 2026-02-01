-- Fix type mismatch: products.supplier_id should be UUID, not text
-- This script converts supplier_id from text to UUID and fixes the foreign key

-- Step 1: Check current column types
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE (table_name = 'products' AND column_name = 'supplier_id')
   OR (table_name = 'organizations' AND column_name = 'id');

-- Step 2: Check if there are any invalid supplier_id values (non-UUID text)
SELECT 
    COUNT(*) as invalid_count,
    'Invalid supplier_id values (not UUID format)' as description
FROM products
WHERE supplier_id IS NOT NULL
  AND supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Drop the existing foreign key constraint
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

-- Step 4: Convert supplier_id from text to UUID
-- First, check if we can safely convert
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for invalid UUIDs
    SELECT COUNT(*) INTO invalid_count
    FROM products
    WHERE supplier_id IS NOT NULL
      AND supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % invalid supplier_id values. These will be set to NULL.', invalid_count;
        
        -- Set invalid UUIDs to NULL (they'll need to be fixed manually)
        UPDATE products
        SET supplier_id = NULL
        WHERE supplier_id IS NOT NULL
          AND supplier_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    END IF;
END $$;

-- Step 5: Convert the column type from text to UUID
DO $$
BEGIN
    -- Check current type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products'
          AND column_name = 'supplier_id'
          AND udt_name != 'uuid'
    ) THEN
        -- Convert text to UUID
        ALTER TABLE products 
        ALTER COLUMN supplier_id TYPE UUID USING supplier_id::uuid;
        
        RAISE NOTICE 'Converted supplier_id from text to UUID';
    ELSE
        RAISE NOTICE 'supplier_id is already UUID type';
    END IF;
END $$;

-- Step 6: Create the correct foreign key constraint
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
        
        RAISE NOTICE 'Created foreign key constraint: products.supplier_id -> organizations.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Step 7: Verify the fix
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    kcu.data_type as column_type,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    ccu.data_type as foreign_column_type,
    CASE 
        WHEN ccu.table_name = 'organizations' 
         AND ccu.column_name = 'id'
         AND kcu.data_type = 'uuid'
         AND ccu.data_type = 'uuid'
        THEN '✅ CORRECT'
        ELSE '❌ STILL WRONG'
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.columns AS col
    ON col.table_name = kcu.table_name
    AND col.column_name = kcu.column_name
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'supplier_id';
