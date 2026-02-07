-- Verification Query: Check that postal codes are in separate column
-- Run this after importing suppliers to verify postal codes are properly stored

-- Show the structure: postal_code is a separate column
SELECT 
    '=== POSTAL CODE COLUMN STRUCTURE ===' as info;

SELECT 
    name as company_name,
    address,                    -- Address column (full street address)
    postal_code,               -- Postal code column (separate, 6-digit Singapore postal code)
    phone,
    email
FROM tenants
WHERE type = 'supplier' AND status = 'active'
ORDER BY name
LIMIT 10;

-- Verify all suppliers have postal codes
SELECT 
    '=== POSTAL CODE COVERAGE ===' as info;

SELECT 
    COUNT(*) as total_suppliers,
    COUNT(CASE WHEN postal_code IS NOT NULL THEN 1 END) as with_postal_code,
    COUNT(CASE WHEN postal_code IS NOT NULL AND LENGTH(postal_code) = 6 THEN 1 END) as with_valid_6digit_postal,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address,
    ROUND(100.0 * COUNT(CASE WHEN postal_code IS NOT NULL THEN 1 END) / COUNT(*), 2) as postal_code_coverage_pct
FROM tenants
WHERE type = 'supplier' AND status = 'active';

-- Sample showing postal codes are separate from addresses
SELECT 
    '=== SAMPLE: POSTAL CODES SEPARATE FROM ADDRESSES ===' as info;

SELECT 
    name as company,
    SUBSTRING(address, 1, 50) as address_preview,
    postal_code,
    CASE 
        WHEN postal_code IS NOT NULL AND address IS NOT NULL 
        THEN '✅ Both in separate columns'
        ELSE '⚠️ Missing data'
    END as status
FROM tenants
WHERE type = 'supplier' AND status = 'active'
  AND postal_code IS NOT NULL
ORDER BY name
LIMIT 5;
