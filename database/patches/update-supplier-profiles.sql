-- Update existing supplier dummy data with all new profile fields
-- This script populates suppliers in the tenants table with complete profile information

-- Update Supplier 1: ABC Materials Supplier (from seed.ts)
UPDATE tenants
SET 
    phone = '+1-555-0101',
    address = '123 Supplier Street, Industrial District',
    postal_code = '12345',
    metadata = jsonb_build_object(
        'registrationNumber', 'REG-ABC-2024-001',
        'contactPerson', 'John Smith',
        'website', 'https://www.abcmaterials.com',
        'taxId', 'TAX-ABC-123456',
        'businessLicense', 'BL-ABC-789012',
        'description', 'Leading supplier of construction materials including cement, steel, and aggregates. Serving the construction industry for over 20 years.',
        'city', 'New York',
        'state', 'NY',
        'country', 'USA'
    ),
    updated_at = NOW()
WHERE email = 'supplier@example.com' AND type = 'supplier';

-- Update suppliers from create-dummy-data.sql (organizations table)
-- Note: If using organizations table, these would need to be updated separately
-- For now, we'll focus on tenants table which is what the API uses

-- Update Supplier: ABC Construction Materials Ltd
UPDATE tenants
SET 
    phone = '+1-555-0201',
    address = '456 Construction Avenue, Building Materials District',
    postal_code = '10001',
    metadata = jsonb_build_object(
        'registrationNumber', 'REG-ABC-CONST-2024-001',
        'contactPerson', 'John Smith',
        'website', 'https://www.abcconstruction.com',
        'taxId', 'TAX-ABC-CONST-234567',
        'businessLicense', 'BL-ABC-CONST-890123',
        'description', 'ABC Construction Materials Ltd specializes in high-quality construction materials including Portland cement, steel rebar, river sand, and crushed stone. We serve contractors and construction companies nationwide.',
        'city', 'New York',
        'state', 'New York',
        'country', 'United States'
    ),
    updated_at = NOW()
WHERE email = 'info@abcconstruction.com' AND type = 'supplier';

-- Update Supplier: XYZ Building Supplies Inc
UPDATE tenants
SET 
    phone = '+1-555-0301',
    address = '789 Building Supplies Boulevard, Commercial Zone',
    postal_code = '10002',
    metadata = jsonb_build_object(
        'registrationNumber', 'REG-XYZ-BUILD-2024-002',
        'contactPerson', 'Michael Jones',
        'website', 'https://www.xyzbuilding.com',
        'taxId', 'TAX-XYZ-BUILD-345678',
        'businessLicense', 'BL-XYZ-BUILD-901234',
        'description', 'XYZ Building Supplies Inc provides a comprehensive range of construction materials including OPC cement, steel reinforcement, fine and coarse sand, gravel, and clay bricks. Quality materials at competitive prices.',
        'city', 'Los Angeles',
        'state', 'California',
        'country', 'United States'
    ),
    updated_at = NOW()
WHERE email = 'contact@xyzbuilding.com' AND type = 'supplier';

-- Update Supplier: Premium Materials Company
UPDATE tenants
SET 
    phone = '+1-555-0401',
    address = '321 Premium Way, Premium Materials Park',
    postal_code = '10003',
    metadata = jsonb_build_object(
        'registrationNumber', 'REG-PMC-2024-003',
        'contactPerson', 'Sarah Williams',
        'website', 'https://www.premiummaterials.com',
        'taxId', 'TAX-PMC-456789',
        'businessLicense', 'BL-PMC-012345',
        'description', 'Premium Materials Company offers high-grade construction materials including premium cement, high-grade steel rebar, premium sand, decorative and ceramic tiles, and premium paint. Quality is our commitment.',
        'city', 'Chicago',
        'state', 'Illinois',
        'country', 'United States'
    ),
    updated_at = NOW()
WHERE email = 'sales@premiummaterials.com' AND type = 'supplier';

-- Update Supplier: Global Construction Supplies
UPDATE tenants
SET 
    phone = '+1-555-0501',
    address = '654 Global Street, International Trade Center',
    postal_code = '10004',
    metadata = jsonb_build_object(
        'registrationNumber', 'REG-GCS-2024-004',
        'contactPerson', 'David Brown',
        'website', 'https://www.globalconstruction.com',
        'taxId', 'TAX-GCS-567890',
        'businessLicense', 'BL-GCS-123456',
        'description', 'Global Construction Supplies is a leading provider of construction materials including various cement types, steel wire mesh, ready mix concrete, plaster sand, roofing tiles, and PVC pipes. Serving projects of all sizes.',
        'city', 'Houston',
        'state', 'Texas',
        'country', 'United States'
    ),
    updated_at = NOW()
WHERE email = 'info@globalconstruction.com' AND type = 'supplier';

-- Update Supplier: Best Value Materials
UPDATE tenants
SET 
    phone = '+1-555-0601',
    address = '987 Value Drive, Economy Materials Hub',
    postal_code = '10005',
    metadata = jsonb_build_object(
        'registrationNumber', 'REG-BVM-2024-005',
        'contactPerson', 'Lisa Anderson',
        'website', 'https://www.bestvaluematerials.com',
        'taxId', 'TAX-BVM-678901',
        'businessLicense', 'BL-BVM-234567',
        'description', 'Best Value Materials provides cost-effective construction materials including economy cement, standard steel rebar, building sand, aggregates, hollow blocks, standard paint, and wood planks. Quality materials at affordable prices.',
        'city', 'Phoenix',
        'state', 'Arizona',
        'country', 'United States'
    ),
    updated_at = NOW()
WHERE email = 'contact@bestvaluematerials.com' AND type = 'supplier';

-- Generic update for any other suppliers that might exist
-- This ensures all suppliers have at least basic metadata structure
DO $$
DECLARE
    supplier_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR supplier_record IN 
        SELECT id, name, metadata 
        FROM tenants 
        WHERE type = 'supplier' 
          AND (metadata IS NULL OR metadata = '{}'::jsonb OR metadata->>'registrationNumber' IS NULL)
        ORDER BY created_at
    LOOP
        UPDATE tenants
        SET 
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'registrationNumber', COALESCE(metadata->>'registrationNumber', 'REG-' || UPPER(SUBSTRING(supplier_record.name FROM 1 FOR 3)) || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::text, 3, '0')),
                'contactPerson', COALESCE(metadata->>'contactPerson', 'Contact Person'),
                'website', COALESCE(metadata->>'website', 'https://www.' || LOWER(REPLACE(supplier_record.name, ' ', '')) || '.com'),
                'taxId', COALESCE(metadata->>'taxId', 'TAX-' || UPPER(SUBSTRING(supplier_record.name FROM 1 FOR 3)) || '-' || LPAD(counter::text, 6, '0')),
                'businessLicense', COALESCE(metadata->>'businessLicense', 'BL-' || UPPER(SUBSTRING(supplier_record.name FROM 1 FOR 3)) || '-' || LPAD(counter::text, 6, '0')),
                'description', COALESCE(metadata->>'description', supplier_record.name || ' is a trusted supplier of construction materials.'),
                'city', COALESCE(metadata->>'city', 'City'),
                'state', COALESCE(metadata->>'state', 'State'),
                'country', COALESCE(metadata->>'country', 'United States')
            ),
            phone = COALESCE(phone, '+1-555-0000'),
            address = COALESCE(address, 'Address to be updated'),
            postal_code = COALESCE(postal_code, '00000'),
            updated_at = NOW()
        WHERE id = supplier_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Display summary of updated suppliers
SELECT 
    '=== UPDATED SUPPLIERS SUMMARY ===' as summary;

SELECT 
    id,
    name,
    email,
    phone,
    address,
    postal_code,
    metadata->>'registrationNumber' as registration_number,
    metadata->>'contactPerson' as contact_person,
    metadata->>'website' as website,
    metadata->>'city' as city,
    metadata->>'state' as state,
    metadata->>'country' as country,
    updated_at
FROM tenants
WHERE type = 'supplier'
ORDER BY name;

-- Count updated suppliers
SELECT 
    '=== UPDATE SUMMARY ===' as summary,
    COUNT(*) as total_suppliers_updated,
    COUNT(CASE WHEN metadata->>'registrationNumber' IS NOT NULL THEN 1 END) as suppliers_with_registration,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as suppliers_with_phone,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as suppliers_with_address
FROM tenants
WHERE type = 'supplier';
