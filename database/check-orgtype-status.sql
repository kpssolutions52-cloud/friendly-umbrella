-- Quick diagnostic: Check if OrgType enum exists and is correctly configured
-- Run this to verify the enum issue is resolved

-- Check what enum types exist
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values,
    CASE 
        WHEN t.typname = 'OrgType' THEN '✅ CORRECT (Prisma compatible)'
        WHEN t.typname = 'orgtype' THEN '⚠️  WRONG (lowercase - will cause Prisma errors)'
        ELSE '❓ UNKNOWN'
    END as status
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('orgtype', 'OrgType')
GROUP BY t.typname;

-- Check what the organizations table is using
SELECT 
    column_name,
    data_type,
    udt_name,
    CASE 
        WHEN udt_name = 'OrgType' THEN '✅ CORRECT'
        WHEN udt_name = 'orgtype' THEN '❌ WRONG (needs migration)'
        ELSE '❓ UNKNOWN TYPE'
    END as status
FROM information_schema.columns
WHERE table_name = 'organizations' 
  AND column_name = 'type';

-- Summary
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgType') 
         AND EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'organizations' 
               AND column_name = 'type' 
               AND udt_name = 'OrgType'
         ) THEN '✅ OrgType enum is correctly configured'
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orgtype') THEN '❌ Found lowercase orgtype - run fix-orgtype-enum.sql'
        WHEN NOT EXISTS (SELECT 1 FROM pg_type WHERE typname IN ('orgtype', 'OrgType')) THEN '❌ No OrgType enum found - run fix-orgtype-enum.sql'
        ELSE '⚠️  OrgType exists but organizations table is not using it - run fix-orgtype-enum.sql'
    END as overall_status;
