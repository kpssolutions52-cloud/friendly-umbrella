-- Import suppliers from CSV file
-- This script imports supplier data from suppliers_singapore.csv
-- 
-- Usage:
-- 1. Ensure suppliers_singapore.csv is in the project root
-- 2. Run this script in your PostgreSQL database
-- 
-- Note: This script uses COPY command which requires file access.
-- For Supabase or cloud databases, you may need to use a different import method.

-- Create temporary table to hold CSV data
CREATE TEMP TABLE IF NOT EXISTS suppliers_temp (
    id TEXT,
    name VARCHAR(255),
    type VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    postal_code VARCHAR(20),
    status VARCHAR(50),
    is_active BOOLEAN,
    metadata JSONB
);

-- Import CSV data (adjust path as needed)
-- For local PostgreSQL:
-- COPY suppliers_temp FROM '/path/to/suppliers_singapore.csv' WITH (FORMAT csv, HEADER true, QUOTE '"');

-- For Supabase/Cloud, you may need to:
-- 1. Use the Supabase dashboard to import CSV
-- 2. Or use a script to read CSV and insert via API
-- 3. Or use psql with \copy command

-- Alternative: Manual insert using INSERT statements
-- This approach reads the CSV and generates INSERT statements

-- Insert suppliers into tenants table
-- Only insert if email doesn't already exist (to avoid duplicates)
INSERT INTO tenants (
    id,
    name,
    type,
    email,
    phone,
    address,
    postal_code,
    status,
    is_active,
    metadata,
    created_at,
    updated_at
)
SELECT 
    COALESCE(st.id, gen_random_uuid()::text) as id,
    st.name,
    st.type::"TenantType",
    st.email,
    st.phone,
    st.address,
    st.postal_code,
    st.status::"TenantStatus",
    st.is_active,
    st.metadata::jsonb,
    NOW() as created_at,
    NOW() as updated_at
FROM suppliers_temp st
WHERE NOT EXISTS (
    SELECT 1 FROM tenants t WHERE t.email = st.email
)
ON CONFLICT (email) DO NOTHING;

-- Display summary
SELECT 
    '=== IMPORT SUMMARY ===' as summary;

SELECT 
    COUNT(*) as total_imported,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address,
    COUNT(CASE WHEN postal_code IS NOT NULL THEN 1 END) as with_postal_code
FROM tenants
WHERE type = 'supplier'
  AND created_at >= NOW() - INTERVAL '1 hour';  -- Suppliers imported in last hour

-- Show sample of imported suppliers
SELECT 
    name,
    email,
    phone,
    address,
    postal_code,
    metadata->>'source' as source
FROM tenants
WHERE type = 'supplier'
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Clean up temporary table
DROP TABLE IF EXISTS suppliers_temp;
