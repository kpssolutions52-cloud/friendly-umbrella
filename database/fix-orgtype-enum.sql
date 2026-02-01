-- Fix OrgType enum issue: Prisma expects "OrgType" (PascalCase) but it may be "orgtype" (lowercase)
-- This script ensures the enum exists with the correct name

-- Step 1: Check what enum types currently exist
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('orgtype', 'OrgType')
GROUP BY t.typname;

-- Step 2: Check what the organizations table is currently using
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'organizations' 
  AND column_name = 'type';

-- Step 3: Create OrgType enum if it doesn't exist
DO $$
BEGIN
    -- Check if OrgType (PascalCase) exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgType') THEN
        -- Check if orgtype (lowercase) exists
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orgtype') THEN
            -- orgtype exists but OrgType doesn't - we need to migrate
            RAISE NOTICE 'Found orgtype (lowercase) but not OrgType. Migrating...';
            
            -- First, create the new OrgType enum
            CREATE TYPE "OrgType" AS ENUM ('company', 'supplier');
            
            -- Update the organizations table to use the new type
            -- This requires converting the column
            ALTER TABLE organizations 
            ALTER COLUMN type TYPE "OrgType" 
            USING type::text::"OrgType";
            
            -- Drop the old lowercase enum (only if no other tables use it)
            -- Check if any other columns use orgtype
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE udt_name = 'orgtype' 
                AND table_name != 'organizations'
            ) THEN
                DROP TYPE orgtype;
                RAISE NOTICE 'Dropped old orgtype enum';
            ELSE
                RAISE NOTICE 'Keeping orgtype enum as it is used by other tables';
            END IF;
        ELSE
            -- Neither exists - create OrgType
            CREATE TYPE "OrgType" AS ENUM ('company', 'supplier');
            RAISE NOTICE 'Created OrgType enum';
        END IF;
    ELSE
        RAISE NOTICE 'OrgType enum already exists';
    END IF;
END $$;

-- Step 4: Ensure organizations.type column uses OrgType
DO $$
BEGIN
    -- Check if the column is using the wrong type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' 
          AND column_name = 'type'
          AND udt_name != 'OrgType'
    ) THEN
        -- Convert to OrgType
        ALTER TABLE organizations 
        ALTER COLUMN type TYPE "OrgType" 
        USING type::text::"OrgType";
        
        RAISE NOTICE 'Updated organizations.type to use OrgType enum';
    ELSE
        RAISE NOTICE 'organizations.type already uses OrgType enum';
    END IF;
END $$;

-- Step 5: Verify the fix
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values,
    CASE 
        WHEN t.typname = 'OrgType' THEN '✅ CORRECT'
        ELSE '⚠️  WRONG NAME'
    END as status
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('orgtype', 'OrgType')
GROUP BY t.typname;

-- Verify organizations table
SELECT 
    column_name,
    data_type,
    udt_name,
    CASE 
        WHEN udt_name = 'OrgType' THEN '✅ CORRECT'
        ELSE '❌ WRONG TYPE'
    END as status
FROM information_schema.columns
WHERE table_name = 'organizations' 
  AND column_name = 'type';
