-- Check what enum types exist in the database
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%type%' OR t.typname LIKE '%Type%'
ORDER BY t.typname, e.enumsortorder;

-- Also check the organizations table structure
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'organizations' 
  AND column_name = 'type';

-- Check the users table structure
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'type';
