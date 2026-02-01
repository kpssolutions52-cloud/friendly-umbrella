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

-- Step 6: Find and fix orphaned products (supplier_id doesn't exist in organizations)
DO $$
DECLARE
    orphaned_count INTEGER;
    default_supplier_id UUID;
BEGIN
    -- Count orphaned products
    SELECT COUNT(*) INTO orphaned_count
    FROM products p
    WHERE p.supplier_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM organizations o 
          WHERE o.id = p.supplier_id
      );
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned products. Attempting to fix...', orphaned_count;
        
        -- Try to get or create a default supplier organization for orphaned products
        SELECT id INTO default_supplier_id
        FROM organizations
        WHERE type = 'supplier'
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If no supplier exists, create one
        IF default_supplier_id IS NULL THEN
            INSERT INTO organizations (id, name, type, email, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                'Default Supplier Organization',
                'supplier',
                'default-supplier@constructionguru.com',
                NOW(),
                NOW()
            )
            RETURNING id INTO default_supplier_id;
            
            RAISE NOTICE 'Created default supplier organization: %', default_supplier_id;
        END IF;
        
        -- Option 1: Handle orphaned products
        -- Strategy: Make ALL orphaned product SKUs unique first, then assign them
        -- Simplest approach: make all orphaned SKUs unique to avoid any conflicts
        
        -- Step 1: Make SKUs unique for ALL orphaned products
        -- This ensures no conflicts when assigning to default supplier
        UPDATE products p
        SET sku = sku || '-ORPHAN-' || SUBSTRING(p.id::text, 1, 8)
        WHERE p.supplier_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM organizations o 
              WHERE o.id = p.supplier_id
          );
        
        -- Step 2: Now assign all orphaned products to default supplier
        -- (All SKUs are now unique, so this should work)
        UPDATE products p
        SET supplier_id = default_supplier_id
        WHERE p.supplier_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM organizations o 
              WHERE o.id = p.supplier_id
          );
        
        -- Step 3: Verify no orphaned products remain
        SELECT COUNT(*) INTO orphaned_count
        FROM products p
        WHERE p.supplier_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM organizations o 
              WHERE o.id = p.supplier_id
          );
        
        IF orphaned_count > 0 THEN
            RAISE WARNING 'Still have % orphaned products after fix. These may need manual attention.', orphaned_count;
        END IF;
        
        RAISE NOTICE 'Assigned orphaned products to default supplier organization (duplicates handled)';
        
        -- Option 2: If you prefer to DELETE orphaned products instead, uncomment this:
        /*
        DELETE FROM products p
        WHERE p.supplier_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM organizations o 
              WHERE o.id = p.supplier_id
          );
        RAISE NOTICE 'Deleted % orphaned products', orphaned_count;
        */
    ELSE
        RAISE NOTICE 'No orphaned products found';
    END IF;
END $$;

-- Step 7: Create the correct foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_supplier_id_fkey'
        AND table_name = 'products'
    ) THEN
        -- Verify no orphaned products exist before creating constraint
        IF EXISTS (
            SELECT 1 FROM products p
            WHERE p.supplier_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM organizations o 
                  WHERE o.id = p.supplier_id
              )
        ) THEN
            RAISE EXCEPTION 'Cannot create foreign key: orphaned products still exist. Please fix them first.';
        END IF;
        
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

-- Step 8: Verify the fix
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    col.data_type as column_type,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    col_fk.data_type as foreign_column_type,
    CASE 
        WHEN ccu.table_name = 'organizations' 
         AND ccu.column_name = 'id'
         AND col.data_type = 'uuid'
         AND col_fk.data_type = 'uuid'
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
    AND col.table_schema = kcu.table_schema
JOIN information_schema.columns AS col_fk
    ON col_fk.table_name = ccu.table_name
    AND col_fk.column_name = ccu.column_name
    AND col_fk.table_schema = ccu.table_schema
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'supplier_id';
