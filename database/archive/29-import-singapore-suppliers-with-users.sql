-- Import Singapore Suppliers with Demo Credentials
-- Generated from suppliers_singapore.csv
-- Demo Password for all suppliers: Demo123!

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Supplier: #1 DESIGN STUDIO PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'ed5e3486-223a-4695-a70d-afd83af5f965',
    '#1 DESIGN STUDIO PTE. LTD.',
    'supplier',
    'contact@#1designstudiopteltd.com.sg',
    '84885022',
    '1085, EUNOS AVENUE 7A, ##03-10, EUNOS INDUSTRIAL ESTATE',
    '409535',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@#1designstudiopteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '65239896-e181-40cf-87c2-12c9a3e8ab3a',
    'ed5e3486-223a-4695-a70d-afd83af5f965',
    'contact@#1designstudiopteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '#1',
    'DESIGN STUDIO',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 'A' BUILDERS AND ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '517d9f55-f33b-41ce-a6e2-caddac4053e0',
    '''A'' BUILDERS AND ENGINEERING PTE. LTD.',
    'supplier',
    'contact@''a''buildersandengineeringpteltd.com.sg',
    '91190252',
    '13, KAKI BUKIT INDUSTRIAL TERRACE, #na, na',
    '416096',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@'a'buildersandengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'a9b26391-e080-4278-86ce-89acd164b8d4',
    '517d9f55-f33b-41ce-a6e2-caddac4053e0',
    'contact@''a''buildersandengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '''A''',
    'BUILDERS AND',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: @BSOLUTE AIRCON PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'fbad3399-650b-424f-8fb9-029b916c62d2',
    '@BSOLUTE AIRCON PTE. LTD.',
    'supplier',
    'contact@@bsoluteairconpteltd.com.sg',
    '68448444',
    '61, KAKI BUKIT AVENUE 1, ##03-05, SHUN LI INDUSTRIAL PARK',
    '417943',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@@bsoluteairconpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '660a6b40-da8a-492e-9314-30dc6fa7d4bf',
    'fbad3399-650b-424f-8fb9-029b916c62d2',
    'contact@@bsoluteairconpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '@BSOLUTE',
    'AIRCON',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: @KLEANSG SERVICES PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'cdc688ec-309c-4f2c-ae0c-423c9e6d7555',
    '@KLEANSG SERVICES PTE LTD',
    'supplier',
    'contact@@kleansgservicespteltd.com.sg',
    '80326100',
    '11, PENAGA PLACE, ##01-11, na',
    '757346',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - FM04 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "FM04", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@@kleansgservicespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '0c418f14-5731-47df-b340-ad6715c84ac1',
    'cdc688ec-309c-4f2c-ae0c-423c9e6d7555',
    'contact@@kleansgservicespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '@KLEANSG',
    'SERVICES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1 CHUAN PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '109b50f1-ca29-4eb4-8f55-01b94e48bad5',
    '1 CHUAN PTE. LTD.',
    'supplier',
    'contact@1chuanpteltd.com.sg',
    '67586512',
    '1, YISHUN STREET 23, ##06-06, YS-ONE',
    '768441',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1chuanpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '18fab287-0ee7-4572-9d92-48989a2b4e0e',
    '109b50f1-ca29-4eb4-8f55-01b94e48bad5',
    'contact@1chuanpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1',
    'CHUAN',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1 PLUS PRIVATE LIMITED
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '3cb5b050-ae6a-4030-9d6d-619b9e86275c',
    '1 PLUS PRIVATE LIMITED',
    'supplier',
    'contact@1plusprivatelimited.com.sg',
    '62218626',
    '9, TAI SENG LINK, ##08-00, na',
    '534053',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - FM02 (Grade: L3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "FM02", "grade": "L3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1plusprivatelimited.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '24a542e0-a35c-4bd9-b9e5-912a27d96458',
    '3cb5b050-ae6a-4030-9d6d-619b9e86275c',
    'contact@1plusprivatelimited.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1',
    'PLUS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1 PR PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '095c209e-7474-43f7-98c1-4c6b3dd9f1b2',
    '1 PR PTE LTD',
    'supplier',
    'contact@1prpteltd.com.sg',
    '84984118',
    '5, 5 ANG MO KIO INDUSTRIAL PARK 2A, ##04-27, na',
    '567760',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1prpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '72c0e6e5-2ed5-46e9-ba9a-636394e2dcf7',
    '095c209e-7474-43f7-98c1-4c6b3dd9f1b2',
    'contact@1prpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1',
    'PR',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1-SOLUTIONING PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'c2268b66-4945-4f7c-9f70-7d48ff970488',
    '1-SOLUTIONING PTE LTD',
    'supplier',
    'contact@1-solutioningpteltd.com.sg',
    '62350939',
    '3, ANG MO KIO STREET 62, ##03-23/24, LINK@AMK',
    '569139',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L2)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L2", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1-solutioningpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '9f88570a-a2b6-4ba0-9664-85bf1be4dd04',
    'c2268b66-4945-4f7c-9f70-7d48ff970488',
    'contact@1-solutioningpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1-SOLUTIONING',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 100 INFRASTRUCTURE PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '46d49890-a88d-43d2-a233-813eb09a81f4',
    '100 INFRASTRUCTURE PTE LTD',
    'supplier',
    'contact@100infrastructurepteltd.com.sg',
    '65098269',
    '33, UBI AVENUE 3, ##07-61, VERTEX',
    '408868',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR14 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR14", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@100infrastructurepteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '67cbeb85-d2ba-4a70-9be0-db638be0eb4e',
    '46d49890-a88d-43d2-a233-813eb09a81f4',
    'contact@100infrastructurepteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '100',
    'INFRASTRUCTURE',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 101 CONSTRUCTION PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '8cac1d9d-6ff1-4030-a06d-00a0f127e777',
    '101 CONSTRUCTION PTE. LTD.',
    'supplier',
    'contact@101constructionpteltd.com.sg',
    '97253966',
    '292A, COMPASSVALE STREET, ##04-228, na',
    '541292',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - TR09 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "TR09", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@101constructionpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '343e792d-332a-4153-9269-b4c8bccb754e',
    '8cac1d9d-6ff1-4030-a06d-00a0f127e777',
    'contact@101constructionpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '101',
    'CONSTRUCTION',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 11STAR ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'c139574d-2587-4199-80d3-7df6a9ca4ead',
    '11STAR ENGINEERING PTE. LTD.',
    'supplier',
    'contact@11starengineeringpteltd.com.sg',
    '90124765',
    '140, UPPER BUKIT TIMAH ROAD, ##03-15, BEAUTY WORLD PLAZA',
    '588176',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@11starengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '1f3504af-c80f-4656-950b-abfb32e225bd',
    'c139574d-2587-4199-80d3-7df6a9ca4ead',
    'contact@11starengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '11STAR',
    'ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 18 DEGREE SERVICES PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '4800d07e-78dc-4f89-9539-d663cf3689d7',
    '18 DEGREE SERVICES PTE. LTD.',
    'supplier',
    'contact@18degreeservicespteltd.com.sg',
    '67546234',
    '20, ANG MO KIO INDUSTRIAL PARK 2A, ##06-04, AMK TECHLINK',
    '567761',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@18degreeservicespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '1836c253-ac59-4fb2-afbb-1ff83cea1aea',
    '4800d07e-78dc-4f89-9539-d663cf3689d7',
    'contact@18degreeservicespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '18',
    'DEGREE SERVICES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 18 STEPS PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'b64fcceb-2411-453e-87ac-765c0b812486',
    '18 STEPS PTE LTD',
    'supplier',
    'contact@18stepspteltd.com.sg',
    '83283799',
    '73, 73 ubi road 1, ##08-58, oxley bizhub',
    '408733',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@18stepspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '5a9ef806-2a97-40f5-9757-e0537bdc52db',
    'b64fcceb-2411-453e-87ac-765c0b812486',
    'contact@18stepspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '18',
    'STEPS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1800NOPESTS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '58352ae9-9ddf-4622-aefb-be1fb467654d',
    '1800NOPESTS PTE. LTD.',
    'supplier',
    'contact@1800nopestspteltd.com.sg',
    '62446926',
    '9010, TAMPINES STREET 93, ##02-93, TAMPINES INDUSTRIAL PARK A',
    '528844',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - FM04 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "FM04", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1800nopestspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '6096ae25-d1df-4f95-a7bb-6258729ce4ed',
    '58352ae9-9ddf-4622-aefb-be1fb467654d',
    'contact@1800nopestspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1800NOPESTS',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 189 BUILDER PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '93747d96-c580-4a1b-a2d9-40318a1b1849',
    '189 BUILDER PTE LTD',
    'supplier',
    'contact@189builderpteltd.com.sg',
    '67351189',
    '293, RIVER VALLEY ROAD, #na, na',
    '238334',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@189builderpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '5dd63881-e59a-48ea-87a9-f273c139ea06',
    '93747d96-c580-4a1b-a2d9-40318a1b1849',
    'contact@189builderpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '189',
    'BUILDER',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1ALPHABET PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '15b67639-1eea-44d9-8ae2-0bd29162fe65',
    '1ALPHABET PTE LTD',
    'supplier',
    'contact@1alphabetpteltd.com.sg',
    '81775544',
    '1014, GEYLANG EAST AVE 3, ##06-204, na',
    '389729',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1alphabetpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '82561ef0-c75f-4c82-b4be-c51da22f2b7e',
    '15b67639-1eea-44d9-8ae2-0bd29162fe65',
    'contact@1alphabetpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1ALPHABET',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1E SERVICES PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '3a1ad906-3bbb-4644-816f-8efacd05ea3c',
    '1E SERVICES PTE. LTD.',
    'supplier',
    'contact@1eservicespteltd.com.sg',
    '91547688',
    '35, TANNERY ROAD, ##03-06A, RUBY INDUSTRIAL COMPLEX',
    '347740',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1eservicespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '4cfa3ab8-481b-4a43-9572-a3afd0740ed5',
    '3a1ad906-3bbb-4644-816f-8efacd05ea3c',
    'contact@1eservicespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1E',
    'SERVICES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1ESS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'dd1cce1f-4e9c-4d4e-834b-de0b090bb4a6',
    '1ESS PTE. LTD.',
    'supplier',
    'contact@1esspteltd.com.sg',
    '97509961',
    '1, SOON LEE STREET, ##05-70, PIONEER CENTRE',
    '627605',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME11 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME11", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1esspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '9cbc69e0-2223-44a9-94fa-f896f548d560',
    'dd1cce1f-4e9c-4d4e-834b-de0b090bb4a6',
    'contact@1esspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1ESS',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1SOLAR PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '6ef9033b-b88a-4ca0-a953-94590e88b477',
    '1SOLAR PTE LTD',
    'supplier',
    'contact@1solarpteltd.com.sg',
    '90468836',
    '10, JALAN BESAR, ##08-10, na',
    '208787',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME03 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME03", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1solarpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '8537df2a-ac5e-4437-afdf-dbfe0f1c0eaa',
    '6ef9033b-b88a-4ca0-a953-94590e88b477',
    'contact@1solarpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1SOLAR',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1ST CLEANING SERVICES PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '9ab48858-e1c1-4241-83ff-8086ca9031f8',
    '1ST CLEANING SERVICES PTE LTD',
    'supplier',
    'contact@1stcleaningservicespteltd.com.sg',
    '86497777',
    '60, KAKI BUKIT PLACE, ##07-04, EUNOS TECHPARK',
    '415979',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - FM02 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "FM02", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1stcleaningservicespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '238a5de0-a48a-4f06-a7f2-d96549fc22c0',
    '9ab48858-e1c1-4241-83ff-8086ca9031f8',
    'contact@1stcleaningservicespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1ST',
    'CLEANING SERVICES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1ST ELECTRICAL SERVICES
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '6b3f5b42-3c7a-45f1-8244-09d80799d139',
    '1ST ELECTRICAL SERVICES',
    'supplier',
    'contact@1stelectricalservices.com.sg',
    '87770811',
    '60, JALAN LAM HUAT, ##03-42, CARROS CENTRE',
    '737869',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1stelectricalservices.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '533b711e-e2a8-4ec5-9d8a-bb19de4616e0',
    '6b3f5b42-3c7a-45f1-8244-09d80799d139',
    'contact@1stelectricalservices.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1ST',
    'ELECTRICAL SERVICES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1ST POWER ELECTRICAL ENGINEERING
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'a31671b0-72a5-4059-8675-50346c12635c',
    '1ST POWER ELECTRICAL ENGINEERING',
    'supplier',
    'contact@1stpowerelectricalengineering.com.sg',
    '91810031',
    '8, BURN ROAD, #12-12, TRIVEX',
    '369977',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1stpowerelectricalengineering.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '325da39d-3bb8-4cea-8db9-dab34ae2b079',
    'a31671b0-72a5-4059-8675-50346c12635c',
    'contact@1stpowerelectricalengineering.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1ST',
    'POWER ELECTRICAL',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1ST SOLUTION GROUP PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '3ef4cd4c-eee6-434e-a857-f21e5eafde78',
    '1ST SOLUTION GROUP PTE. LTD.',
    'supplier',
    'contact@1stsolutiongrouppteltd.com.sg',
    '67437666',
    '45, KALLANG PUDDING ROAD, ##09-02, ALPHA BUILDING',
    '349317',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME03 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME03", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1stsolutiongrouppteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '00dc8427-343d-4c3b-ae9d-b71be9e68aab',
    '3ef4cd4c-eee6-434e-a857-f21e5eafde78',
    'contact@1stsolutiongrouppteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1ST',
    'SOLUTION GROUP',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1STAR ENGINEERING
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'ca42b3b3-8597-48ba-bca9-10ac45459329',
    '1STAR ENGINEERING',
    'supplier',
    'contact@1starengineering.com.sg',
    '90228126',
    '1, SUNVIEW ROAD, ##02-02, ECO-TECH@SUNVIEW',
    '627615',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1starengineering.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '845d5f06-1d94-44f3-83db-2ba6505391d7',
    'ca42b3b3-8597-48ba-bca9-10ac45459329',
    'contact@1starengineering.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1STAR',
    'ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 1STOP BUILDERS PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '519e986a-5659-4e85-9934-26510145eb0f',
    '1STOP BUILDERS PTE LTD',
    'supplier',
    'contact@1stopbuilderspteltd.com.sg',
    '69096160',
    '11, MANDAI ESTATE, ##10-12, ELDIX',
    '729908',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@1stopbuilderspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '04dafbb9-590d-42df-9850-27ce55b88bd1',
    '519e986a-5659-4e85-9934-26510145eb0f',
    'contact@1stopbuilderspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '1STOP',
    'BUILDERS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2 BOX DESIGN PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '95b9de84-28d8-4a68-8255-83950a9b2b9d',
    '2 BOX DESIGN PTE LTD',
    'supplier',
    'contact@2boxdesignpteltd.com.sg',
    '82085951',
    '6, UBI ROAD, ##08-04, WINTECH CENTRE',
    '408726',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2boxdesignpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'efe0c6a3-908f-433a-93a7-f28228dadc68',
    '95b9de84-28d8-4a68-8255-83950a9b2b9d',
    'contact@2boxdesignpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2',
    'BOX DESIGN',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 21 CONSTRUCTION ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'fb93ab8b-2298-4d90-b2d9-869ab2c0e358',
    '21 CONSTRUCTION ENGINEERING PTE. LTD.',
    'supplier',
    'contact@21constructionengineeringpteltd.com.sg',
    '62550887',
    '25, BUKIT BATOK CRESCENT, ##08-04, THE ELITIST',
    '658066',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@21constructionengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '514e9af3-3924-41f4-907e-8985f29d64cd',
    'fb93ab8b-2298-4d90-b2d9-869ab2c0e358',
    'contact@21constructionengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '21',
    'CONSTRUCTION ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 21 SHUTTERS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '04421999-2e51-4d3b-8725-7dbd675bc3a5',
    '21 SHUTTERS PTE. LTD.',
    'supplier',
    'contact@21shutterspteltd.com.sg',
    '64452121',
    '3018, BEDOK NORTH STREET 5, ##03-12, EASTLINK',
    '486132',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR18 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR18", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@21shutterspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '0d6cfa3e-0f50-49ca-8be0-2ddfb30f234f',
    '04421999-2e51-4d3b-8725-7dbd675bc3a5',
    'contact@21shutterspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '21',
    'SHUTTERS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 21ST DECOR ENGINEERING PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '4a5c6d30-1497-40ee-8e95-420c3da5024a',
    '21ST DECOR ENGINEERING PTE LTD',
    'supplier',
    'contact@21stdecorengineeringpteltd.com.sg',
    '67342322',
    '1, SOON LEE STREET, ##06-31, PIONEER CENTRE',
    '627605',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@21stdecorengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '165b804e-a37a-4078-9893-8f806748aab9',
    '4a5c6d30-1497-40ee-8e95-420c3da5024a',
    'contact@21stdecorengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '21ST',
    'DECOR ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 23 DEGREES PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '0ba10854-b7f4-4fb5-b037-310d3ccf9cc4',
    '23 DEGREES PTE. LTD.',
    'supplier',
    'contact@23degreespteltd.com.sg',
    '97597144',
    '23, UBI ROAD 4, ##02-07, na',
    '408620',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@23degreespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '79ab9b5b-02ef-4c5f-8391-352c66978a80',
    '0ba10854-b7f4-4fb5-b037-310d3ccf9cc4',
    'contact@23degreespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '23',
    'DEGREES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 23 TECHNOLOGIES PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '6f2b7154-9231-4da8-b343-4f5f5300fb27',
    '23 TECHNOLOGIES PTE. LTD.',
    'supplier',
    'contact@23technologiespteltd.com.sg',
    '68461901',
    '1004, TOA PAYOH INDUSTRIAL PARK, ##02-1499, na',
    '319076',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME04 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME04", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@23technologiespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '157982c9-0bd5-4b1a-ab5e-548620c84c0c',
    '6f2b7154-9231-4da8-b343-4f5f5300fb27',
    'contact@23technologiespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '23',
    'TECHNOLOGIES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 25 DEGREES PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '211cd1e8-0479-4ee1-85f7-06a0f0659e26',
    '25 DEGREES PTE LTD',
    'supplier',
    'contact@25degreespteltd.com.sg',
    '96958768',
    '2, SIMS CLOSE, ##02-06, GEMINI',
    '387298',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@25degreespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'b94fc053-8abb-46ec-8623-27922b33c08a',
    '211cd1e8-0479-4ee1-85f7-06a0f0659e26',
    'contact@25degreespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '25',
    'DEGREES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 265 FORWARD BUILDERS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '69317e3e-30b7-4c7e-8247-20c3df67fbb8',
    '265 FORWARD BUILDERS PTE. LTD.',
    'supplier',
    'contact@265forwardbuilderspteltd.com.sg',
    '66430264',
    '20, WOODLANDS WALK, #na, na',
    '738391',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@265forwardbuilderspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'c5d4b917-6267-4773-90a3-e0dec0b48059',
    '69317e3e-30b7-4c7e-8247-20c3df67fbb8',
    'contact@265forwardbuilderspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '265',
    'FORWARD BUILDERS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2BUILDUP PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '127589fa-75ee-445d-a581-34deef4fd655',
    '2BUILDUP PTE LTD',
    'supplier',
    'contact@2builduppteltd.com.sg',
    '91264683',
    '60, PAYA LEBAR ROAD, ##11-25, PAYA LEBAR SQUARE',
    '409051',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2builduppteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '3cfcfb0b-4dcf-4016-b938-a87887cdcc96',
    '127589fa-75ee-445d-a581-34deef4fd655',
    'contact@2builduppteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2BUILDUP',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2D ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '41a45dfd-33fd-4180-a105-86a9bb162193',
    '2D ENGINEERING PTE. LTD.',
    'supplier',
    'contact@2dengineeringpteltd.com.sg',
    '81138210',
    '5, ST GEORGE''S LANE, ##02-181, ST GEORGE''S WEST GARDENS',
    '320005',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2dengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '26dac7c0-79d2-41d7-b567-b2715f350fb6',
    '41a45dfd-33fd-4180-a105-86a9bb162193',
    'contact@2dengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2D',
    'ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2E METAL ART
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '5c129e40-0238-4d87-9c5e-844fc9da33af',
    '2E METAL ART',
    'supplier',
    'contact@2emetalart.com.sg',
    '81869192',
    '1030, EUNOS AVE 6, ##01-50, EUNOS INDUSTRIAL ESTATE',
    '409625',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - RW01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "RW01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2emetalart.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'c76713ec-aa07-4dee-8c20-c4f501a9d9b6',
    '5c129e40-0238-4d87-9c5e-844fc9da33af',
    'contact@2emetalart.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2E',
    'METAL ART',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2HQ BUILDER PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '176e8ba2-7a14-4f6c-8758-6c72f6324adc',
    '2HQ BUILDER PTE LTD',
    'supplier',
    'contact@2hqbuilderpteltd.com.sg',
    '91282066',
    '100, PECK SEAH STREET, ##08-14, PS100',
    '079903',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR09 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR09", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2hqbuilderpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '32b59007-ec9f-49c0-9617-7201abec6290',
    '176e8ba2-7a14-4f6c-8758-6c72f6324adc',
    'contact@2hqbuilderpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2HQ',
    'BUILDER',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2J METAL & ELECTRICAL ENGINEERING
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '36e9fead-1327-4a2a-991e-dd729d43c220',
    '2J METAL & ELECTRICAL ENGINEERING',
    'supplier',
    'contact@2jmetal&electricalengineering.com.sg',
    '67848107',
    '9002, TAMPINES STREET 93, ##01-26, TAMPINES INDUSTRIAL PARK A',
    '528836',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2jmetal&electricalengineering.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'd6a42e47-5723-4f95-bc8c-84b45dbdec73',
    '36e9fead-1327-4a2a-991e-dd729d43c220',
    'contact@2jmetal&electricalengineering.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2J',
    'METAL &',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2K BUILDER PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'd09e4914-86a8-4ff6-84a7-1be2facaaf14',
    '2K BUILDER PTE LTD',
    'supplier',
    'contact@2kbuilderpteltd.com.sg',
    '62542922',
    '50, BUKIT BATOK STREET 23, ##07-06, MIDVIEW BUILDING',
    '659578',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C2)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C2", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2kbuilderpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '60e16d54-f29c-47d5-85a1-229ff23811b8',
    'd09e4914-86a8-4ff6-84a7-1be2facaaf14',
    'contact@2kbuilderpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2K',
    'BUILDER',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2K ENGINEERING WORKS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'f5b48ee6-624f-4f0c-936f-28543fb2ed68',
    '2K ENGINEERING WORKS PTE. LTD.',
    'supplier',
    'contact@2kengineeringworkspteltd.com.sg',
    '62542922',
    '50, BUKIT BATOK STREET 23, ##07-06, MIDVIEW BUILDING',
    '659578',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2kengineeringworkspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '12e9461b-1ee4-4a1b-8503-d6a4aca6a294',
    'f5b48ee6-624f-4f0c-936f-28543fb2ed68',
    'contact@2kengineeringworkspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2K',
    'ENGINEERING WORKS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2K INTERNATIONAL PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '15079ed8-9efd-48c0-b099-0fb53dc72ef6',
    '2K INTERNATIONAL PTE. LTD.',
    'supplier',
    'contact@2kinternationalpteltd.com.sg',
    '62542922',
    '50, BUKIT BATOK STREET 23, ##07-06, MIDVIEW BUILDING',
    '659578',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW02 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW02", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2kinternationalpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '3537117d-75d0-4b32-9118-29d30ef066cf',
    '15079ed8-9efd-48c0-b099-0fb53dc72ef6',
    'contact@2kinternationalpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2K',
    'INTERNATIONAL',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2KBROS ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '960af5fb-fbc7-4c7e-8ba3-76b06ce51c8a',
    '2KBROS ENGINEERING PTE. LTD.',
    'supplier',
    'contact@2kbrosengineeringpteltd.com.sg',
    '87808022',
    '20, UPPER CIRCULAR ROAD, ##01-09, THE RIVERWALK',
    '058416',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2kbrosengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '7b510d3b-9276-4a93-8117-4874803daaab',
    '960af5fb-fbc7-4c7e-8ba3-76b06ce51c8a',
    'contact@2kbrosengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2KBROS',
    'ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2L INTERIOR DESIGN & CONSTRUCTION PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '2142c4fa-0cb5-45bf-9568-cf8f7e801a4b',
    '2L INTERIOR DESIGN & CONSTRUCTION PTE. LTD.',
    'supplier',
    'contact@2linteriordesign&constructionpteltd.com.sg',
    '64497492',
    '37, LORONG 23 GEYLANG, ##03-01A, YU LI INDUSTRIAL BUILDING',
    '388371',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2linteriordesign&constructionpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '401a7cf5-334f-4b30-9a80-92e8c1fdbd2a',
    '2142c4fa-0cb5-45bf-9568-cf8f7e801a4b',
    'contact@2linteriordesign&constructionpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2L',
    'INTERIOR DESIGN',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2ND PHASE DESIGN INTERIOR PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '341c4689-092c-424e-be1c-df1e9ec6900a',
    '2ND PHASE DESIGN INTERIOR PTE LTD',
    'supplier',
    'contact@2ndphasedesigninteriorpteltd.com.sg',
    '63142181',
    '21, WOODLANDS CLOSE, ##04-05, PRIMZ BIZHUB',
    '737854',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2ndphasedesigninteriorpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '38efd716-4ef4-4472-b679-5bd1b9c3fd60',
    '341c4689-092c-424e-be1c-df1e9ec6900a',
    'contact@2ndphasedesigninteriorpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2ND',
    'PHASE DESIGN',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2POINTZERO RENOVATIONS
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'bd2acf0e-39a5-490b-a95e-3fba802948b1',
    '2POINTZERO RENOVATIONS',
    'supplier',
    'contact@2pointzerorenovations.com.sg',
    '87110790',
    '31, WOODLANDS CLOSE, ##08-34, WOODLANDS HORIZON',
    '737855',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2pointzerorenovations.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '41abf6f9-d5eb-4bc5-b719-be870bcc6111',
    'bd2acf0e-39a5-490b-a95e-3fba802948b1',
    'contact@2pointzerorenovations.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2POINTZERO',
    'RENOVATIONS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2SS ENGINEERING PTE.LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '7b84628b-4345-4c17-acdf-97c73ed67c70',
    '2SS ENGINEERING PTE.LTD.',
    'supplier',
    'contact@2ssengineeringpteltd.com.sg',
    '85399148',
    '65, SIMS AVENUE, ##02-01, YI XIU FACTORY BUILDING',
    '387418',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2ssengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'ee817eb1-7617-49c0-b2d9-096b701193c2',
    '7b84628b-4345-4c17-acdf-97c73ed67c70',
    'contact@2ssengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2SS',
    'ENGINEERING PTE..',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2T CONTRACTORS PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '224e708a-8c0c-4dea-b577-f264df2554b0',
    '2T CONTRACTORS PTE LTD',
    'supplier',
    'contact@2tcontractorspteltd.com.sg',
    '90256171',
    '31, WOODLANDS CLOSE, #na, na',
    '737855',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2tcontractorspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '82666969-7a3b-493f-ae47-b20d61f92da1',
    '224e708a-8c0c-4dea-b577-f264df2554b0',
    'contact@2tcontractorspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2T',
    'CONTRACTORS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2TO PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'f80c6f35-aa7b-4a3e-b3ce-576e744e208f',
    '2TO PTE. LTD.',
    'supplier',
    'contact@2topteltd.com.sg',
    '85543542',
    '3012, BEDOK INDUSTRIAL PARK E, ##03-2078, BEDOK INDUSTRIAL PARK E',
    '489978',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2topteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '4c533d9a-a089-410a-9a35-dddb5ab4e127',
    'f80c6f35-aa7b-4a3e-b3ce-576e744e208f',
    'contact@2topteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2TO',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 2XK ENGINEERING PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '14e834c0-a3e1-45d7-9c93-31256774a2a4',
    '2XK ENGINEERING PTE LTD',
    'supplier',
    'contact@2xkengineeringpteltd.com.sg',
    '82015212',
    '71, WOODLANDS AVENUE 10, ##03-01, WOODLANDS INDUSTRIAL XCHANGE',
    '737743',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@2xkengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'b929bc50-2dbc-4a7f-a833-ab51c27b78f5',
    '14e834c0-a3e1-45d7-9c93-31256774a2a4',
    'contact@2xkengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '2XK',
    'ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3 ACES ADVERTISING PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '8e759917-15e2-4093-94b1-e26af89e8f45',
    '3 ACES ADVERTISING PTE LTD',
    'supplier',
    'contact@3acesadvertisingpteltd.com.sg',
    '63795200',
    '2, LENG KEE ROAD, ##04-04, THYE HONG CENTRE',
    '159086',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR11 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR11", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3acesadvertisingpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'a88cd5b2-5df5-4f2f-b3d4-df76a3461b11',
    '8e759917-15e2-4093-94b1-e26af89e8f45',
    'contact@3acesadvertisingpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3',
    'ACES ADVERTISING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3 C FOUNDATIONS PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '9001014c-48a4-4f2f-b583-e58b4adb4990',
    '3 C FOUNDATIONS PTE LTD',
    'supplier',
    'contact@3cfoundationspteltd.com.sg',
    '98806539',
    '10, BUROH STREET, ##05-42, WEST CONNECT BUILDING',
    '627564',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR08 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR08", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3cfoundationspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '42bfc2be-7794-4c9c-8c59-72da08b7456a',
    '9001014c-48a4-4f2f-b583-e58b4adb4990',
    'contact@3cfoundationspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3',
    'C FOUNDATIONS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3 CONCEPTS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '3a43717d-6a63-4fb1-a013-38afc48f5457',
    '3 CONCEPTS PTE. LTD.',
    'supplier',
    'contact@3conceptspteltd.com.sg',
    '90689004',
    '19, KIM KEAT ROAD, ##10-01, FU TSU BUILDING',
    '328804',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3conceptspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'd74eec3b-9bc5-43b0-8c9e-ab55ce7a2e19',
    '3a43717d-6a63-4fb1-a013-38afc48f5457',
    'contact@3conceptspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3',
    'CONCEPTS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3 SQUARE MEDIA SOLUTIONS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '96725e63-67b0-4fe4-a2aa-45e9743f9e6d',
    '3 SQUARE MEDIA SOLUTIONS PTE. LTD.',
    'supplier',
    'contact@3squaremediasolutionspteltd.com.sg',
    '63699116',
    '2, YISHUN INDUSTRIAL STREET 1, ##06-09, NORTH POINT BIZHUB',
    '768159',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3squaremediasolutionspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'ba559e1e-9982-4f77-b759-7e5ae5ffbaa1',
    '96725e63-67b0-4fe4-a2aa-45e9743f9e6d',
    'contact@3squaremediasolutionspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3',
    'SQUARE MEDIA',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3 STAR ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '03027488-8b41-4ba1-9819-2576965b75d2',
    '3 STAR ENGINEERING PTE. LTD.',
    'supplier',
    'contact@3starengineeringpteltd.com.sg',
    '65155220',
    '48, TOH GUAN ROAD EAST, ##03-142, ENTERPRISE HUB',
    '608586',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3starengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '001911d7-6435-4a79-aa3e-1fd464110174',
    '03027488-8b41-4ba1-9819-2576965b75d2',
    'contact@3starengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3',
    'STAR ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3 TOUGH MANAGEMENT PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '2c422716-f64d-4d6e-9aed-51bd455e1bd5',
    '3 TOUGH MANAGEMENT PTE LTD',
    'supplier',
    'contact@3toughmanagementpteltd.com.sg',
    '82233121',
    '1, CORPORATION DRIVE, ##09-09, na',
    '619775',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3toughmanagementpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '0dc7e006-76ce-49b5-961c-8afcadac5099',
    '2c422716-f64d-4d6e-9aed-51bd455e1bd5',
    'contact@3toughmanagementpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3',
    'TOUGH MANAGEMENT',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3+I DESIGN STUDIO PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '205e2322-905d-4316-b8c9-7458522c674c',
    '3+I DESIGN STUDIO PTE LTD',
    'supplier',
    'contact@3+idesignstudiopteltd.com.sg',
    '97876064',
    '35, Kallang Pudding Road, ##04-04F, Tong Lee Building Block A',
    '349314',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3+idesignstudiopteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '4826fbb7-b6e1-4f8e-a19a-589e190b25d0',
    '205e2322-905d-4316-b8c9-7458522c674c',
    'contact@3+idesignstudiopteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3+I',
    'DESIGN STUDIO',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3-LINK ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '39b6eb53-d7c3-48b8-b118-f484e66d6d17',
    '3-LINK ENGINEERING PTE. LTD.',
    'supplier',
    'contact@3-linkengineeringpteltd.com.sg',
    '63565477',
    '56, KALLANG PUDDING ROAD, ##07-02, HH @ KALLANG',
    '349328',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: B1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "B1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3-linkengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'b81b1a31-b48c-486c-a3a4-dbc03ec89f0d',
    '39b6eb53-d7c3-48b8-b118-f484e66d6d17',
    'contact@3-linkengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3-LINK',
    'ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3000IMMUNITY PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '6cbb966b-41d6-46f2-933b-0776b2bdb08a',
    '3000IMMUNITY PTE LTD',
    'supplier',
    'contact@3000immunitypteltd.com.sg',
    '88771572',
    '126, JOO SENG ROAD, ##04-15C, GOLD PINE INDUSTRIAL BUILDING',
    '368355',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - FM04 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "FM04", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3000immunitypteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '8c3b8863-65ee-442c-8c05-98a4d9d98014',
    '6cbb966b-41d6-46f2-933b-0776b2bdb08a',
    'contact@3000immunitypteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3000IMMUNITY',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 338 PRIVATE LIMITED
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'c87511e9-d085-4035-a20a-b125b9d659f2',
    '338 PRIVATE LIMITED',
    'supplier',
    'contact@338privatelimited.com.sg',
    '93233338',
    '331, CLEMENTI AVENUE 2, ##07-154, na',
    '120331',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@338privatelimited.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '2baf5e46-e445-4822-b382-5e840e28771d',
    'c87511e9-d085-4035-a20a-b125b9d659f2',
    'contact@338privatelimited.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '338',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 360 INTEGRATED FM & SM PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '10d32d32-7e1a-4b29-ba3f-04099b20d5ab',
    '360 INTEGRATED FM & SM PTE LTD',
    'supplier',
    'contact@360integratedfm&smpteltd.com.sg',
    '66770360',
    '71, BUKIT BATOK CRESCENT, ##06 - 11, PRESTIGE CENTRE',
    '658071',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@360integratedfm&smpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '101ac3e4-3189-4d18-9816-3693db1ce745',
    '10d32d32-7e1a-4b29-ba3f-04099b20d5ab',
    'contact@360integratedfm&smpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '360',
    'INTEGRATED FM',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 360 INTERIOR AND CONSTRUCTION PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'fd31cf60-082b-4929-b38d-39a74d893ef2',
    '360 INTERIOR AND CONSTRUCTION PTE LTD',
    'supplier',
    'contact@360interiorandconstructionpteltd.com.sg',
    '91379199',
    '8, UBI ROAD 2, ##03-22, ZERVEX',
    '408538',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR03 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR03", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@360interiorandconstructionpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '57137db3-3bba-45b5-a97a-fd932ac34ec5',
    'fd31cf60-082b-4929-b38d-39a74d893ef2',
    'contact@360interiorandconstructionpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '360',
    'INTERIOR AND',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 360AIO PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '73c9c4df-d413-4a30-833b-db4267e7f8cc',
    '360AIO PTE. LTD.',
    'supplier',
    'contact@360aiopteltd.com.sg',
    '68426616',
    '3014, UBI ROAD 1, ##01-292, KAMPONG UBI INDUSTRIAL ESTATE',
    '408702',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME12 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME12", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@360aiopteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '67f4e7ee-9211-4bb1-aa50-1d616fd17fe3',
    '73c9c4df-d413-4a30-833b-db4267e7f8cc',
    'contact@360aiopteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '360AIO',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 366 ENVIRONMENTAL TECHNOLOGY PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'f09cf7ea-8dd2-435e-b91a-b26fbc5304f1',
    '366 ENVIRONMENTAL TECHNOLOGY PTE LTD',
    'supplier',
    'contact@366environmentaltechnologypteltd.com.sg',
    '90944090',
    '6, CHENG SOON LANE, #na, na',
    '599764',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@366environmentaltechnologypteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'f9f49214-8d55-4de9-aeed-6e32a9f37038',
    'f09cf7ea-8dd2-435e-b91a-b26fbc5304f1',
    'contact@366environmentaltechnologypteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '366',
    'ENVIRONMENTAL TECHNOLOGY',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 366 WORLD PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '536c0e86-204d-481d-9cae-7ccc08c625d2',
    '366 WORLD PTE LTD',
    'supplier',
    'contact@366worldpteltd.com.sg',
    '90944090',
    '8, BOON LAY WAY, ##03-14, TRADEHUB 21',
    '609964',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@366worldpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '8b461a7d-af49-4bd8-9dd2-510cdd01d7d0',
    '536c0e86-204d-481d-9cae-7ccc08c625d2',
    'contact@366worldpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '366',
    'WORLD',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 369 BUILDERS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '2aec2cb8-9058-44e9-9657-8071b6f9a3a4',
    '369 BUILDERS PTE. LTD.',
    'supplier',
    'contact@369builderspteltd.com.sg',
    '62479249',
    '101, KITCHENER ROAD, ##03-13, JALAN BESAR PLAZA',
    '208511',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR09 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR09", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@369builderspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '2a076018-222b-4fe5-b594-c2793de0d8db',
    '2aec2cb8-9058-44e9-9657-8071b6f9a3a4',
    'contact@369builderspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '369',
    'BUILDERS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 37 RENOVATION CONTRACTOR PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '7359799a-ade8-479d-9376-fa5e99b257c0',
    '37 RENOVATION CONTRACTOR PTE. LTD.',
    'supplier',
    'contact@37renovationcontractorpteltd.com.sg',
    '65569008',
    '25, KAKI BUKIT ROAD 4, ##05-60, SYNERGY @ KB',
    '417800',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@37renovationcontractorpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'a8abadc0-3a20-4ce7-af32-92b98086965d',
    '7359799a-ade8-479d-9376-fa5e99b257c0',
    'contact@37renovationcontractorpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '37',
    'RENOVATION CONTRACTOR',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 37K VOLTS ENGINEERING PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'ac40e126-c858-4ccd-b6c2-5028ba923472',
    '37K VOLTS ENGINEERING PTE LTD',
    'supplier',
    'contact@37kvoltsengineeringpteltd.com.sg',
    '97292829',
    '1010, DOVER ROAD, ##01-370V, na',
    '139658',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@37kvoltsengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '6ce077f2-a2cb-4cc7-abac-4d67432a39c8',
    'ac40e126-c858-4ccd-b6c2-5028ba923472',
    'contact@37kvoltsengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '37K',
    'VOLTS ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 388 PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '5cfa2d0e-17d7-452e-b23e-0547f25197de',
    '388 PTE. LTD.',
    'supplier',
    'contact@388pteltd.com.sg',
    '63169891',
    '48, TOH GUAN ROAD EAST, ##02-123, ENTERPRISE HUB',
    '608586',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME12 (Grade: L4)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME12", "grade": "L4", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@388pteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'cc8591fc-b5dc-46e5-90de-e34920d2bd12',
    '5cfa2d0e-17d7-452e-b23e-0547f25197de',
    'contact@388pteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '388',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3CELL PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '351b6a7f-2903-4216-aff7-010129339a24',
    '3CELL PTE. LTD.',
    'supplier',
    'contact@3cellpteltd.com.sg',
    '64816451',
    '5066, ANG MO KIO INDUSTRIAL PARK 2, ##01-1395, na',
    '569569',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME04 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME04", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3cellpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'fdef942b-3983-417e-84d0-566ad561a917',
    '351b6a7f-2903-4216-aff7-010129339a24',
    'contact@3cellpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3CELL',
    'Admin',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3D AVE PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '2f4c4d86-5526-4044-b38f-c896f6b86754',
    '3D AVE PTE. LTD.',
    'supplier',
    'contact@3davepteltd.com.sg',
    '67471791',
    '120, EUNOS AVENUE 7, ##01-05, RICHFIELD INDUSTRIAL CENTRE',
    '409574',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - TR10 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "TR10", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3davepteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '7a1599f0-8a6d-4ad5-bf9a-c53f6fb4945a',
    '2f4c4d86-5526-4044-b38f-c896f6b86754',
    'contact@3davepteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3D',
    'AVE',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3D BUILT PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '3f988259-f81a-4de1-b112-ef40824a6a44',
    '3D BUILT PTE. LTD.',
    'supplier',
    'contact@3dbuiltpteltd.com.sg',
    '98825680',
    '100, JALAN SULTAN, #03-32A, TEXTILE CENTRE',
    '199001',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR01 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR01", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3dbuiltpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '1885f389-acb2-44ae-85ed-2539586b7979',
    '3f988259-f81a-4de1-b112-ef40824a6a44',
    'contact@3dbuiltpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3D',
    'BUILT',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3D CREATIVE DESIGN PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'c26465f4-03fe-47e6-a8e5-788be5b88adc',
    '3D CREATIVE DESIGN PTE LTD',
    'supplier',
    'contact@3dcreativedesignpteltd.com.sg',
    '66347122',
    '18, BOON LAY WAY, ##01-97, TRADEHUB 21',
    '609966',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3dcreativedesignpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '6cb3bef4-5594-4fda-a5e2-06e41945329c',
    'c26465f4-03fe-47e6-a8e5-788be5b88adc',
    'contact@3dcreativedesignpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3D',
    'CREATIVE DESIGN',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3D DESIGN BUILDER
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '141c96d3-c70a-4ca6-b64b-8deeddb25039',
    '3D DESIGN BUILDER',
    'supplier',
    'contact@3ddesignbuilder.com.sg',
    '82378257',
    '100, LORONG 23 GEYLANG, ##6-03, D''CENTENNIAL',
    '388398',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3ddesignbuilder.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'efbc2e13-9957-47c2-a335-7e5011a62ed4',
    '141c96d3-c70a-4ca6-b64b-8deeddb25039',
    'contact@3ddesignbuilder.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3D',
    'DESIGN BUILDER',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3E BUILDER & PREFAB PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'a17a54f5-0cbf-42f8-ac69-6cf5483186c1',
    '3E BUILDER & PREFAB PTE. LTD.',
    'supplier',
    'contact@3ebuilder&prefabpteltd.com.sg',
    '96241133',
    '81, TAGORE LANE, ##04-09B, TAG A',
    '787502',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - TR02 (Grade: Single Grade)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "TR02", "grade": "Single Grade", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3ebuilder&prefabpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '74ade601-1d7e-4093-b101-62c4ded20b20',
    'a17a54f5-0cbf-42f8-ac69-6cf5483186c1',
    'contact@3ebuilder&prefabpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3E',
    'BUILDER &',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3E ENGRG PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '435e26ad-36c0-43d4-8c2e-f09a66c6b0a7',
    '3E ENGRG PTE. LTD.',
    'supplier',
    'contact@3eengrgpteltd.com.sg',
    '92288928',
    '933, JURONG WEST STREET 91, ##13-367, NANYANG RUBY',
    '640933',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3eengrgpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '75c8df47-d692-41e7-82b3-6c6e59400d78',
    '435e26ad-36c0-43d4-8c2e-f09a66c6b0a7',
    'contact@3eengrgpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3E',
    'ENGRG',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3E POWER ENGINEERING PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'b529a3de-84b4-4b11-8966-adf674df6665',
    '3E POWER ENGINEERING PTE. LTD.',
    'supplier',
    'contact@3epowerengineeringpteltd.com.sg',
    '63541008',
    '1003, TOA PAYOH INDUSTRIAL PARK, ##04-1525, TOA PAYOH INDUSTRIAL PARK',
    '319075',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3epowerengineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'a20ecbaf-1211-4a00-b090-fc332b7a54d2',
    'b529a3de-84b4-4b11-8966-adf674df6665',
    'contact@3epowerengineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3E',
    'POWER ENGINEERING',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3E SG PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'f540eee1-9deb-4048-8622-c05d0b5ee7f6',
    '3E SG PTE LTD',
    'supplier',
    'contact@3esgpteltd.com.sg',
    '87900078',
    '109, HILLVIEW CRESENT, #na, HILLVIEW VILLAS',
    '669502',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME11 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME11", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3esgpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'af38f3cc-9660-48c3-9056-d9e02d21941e',
    'f540eee1-9deb-4048-8622-c05d0b5ee7f6',
    'contact@3esgpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3E',
    'SG',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3F ENGINEERING & CONSTRUCTION PTE.LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'fb7757e6-d1d4-43d5-85bd-9a769ecefcad',
    '3F ENGINEERING & CONSTRUCTION PTE.LTD.',
    'supplier',
    'contact@3fengineering&constructionpteltd.com.sg',
    '96922279',
    '640, ROWELL ROAD, ##01-78, na',
    '200640',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME05 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME05", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3fengineering&constructionpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'c6c8b17b-906b-4169-b949-fffa193844ba',
    'fb7757e6-d1d4-43d5-85bd-9a769ecefcad',
    'contact@3fengineering&constructionpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3F',
    'ENGINEERING &',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3FR ENTERPRISES PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'd13a1a1b-8f01-4e7c-8cb3-3bc2b8f91ef7',
    '3FR ENTERPRISES PTE LTD',
    'supplier',
    'contact@3frenterprisespteltd.com.sg',
    '87884313',
    '141, CECIL STREET, #07-01, TUNG ANN ASSOCIATION BUILDING',
    '069541',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3frenterprisespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '132eab84-c77e-46ce-b43f-f1f61cb55ddc',
    'd13a1a1b-8f01-4e7c-8cb3-3bc2b8f91ef7',
    'contact@3frenterprisespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3FR',
    'ENTERPRISES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3G CONSTRUCTION PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'b0aa47f1-39d1-4873-8c54-7bf813029318',
    '3G CONSTRUCTION PTE. LTD.',
    'supplier',
    'contact@3gconstructionpteltd.com.sg',
    '68489200',
    '167, BUKIT BATOK WEST AVENUE 8, ##06-236, na',
    '650167',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3gconstructionpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '8439c3cc-b94c-4ffd-969f-850e3595e8d0',
    'b0aa47f1-39d1-4873-8c54-7bf813029318',
    'contact@3gconstructionpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3G',
    'CONSTRUCTION',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3G ELECTRICAL & DESIGN PTE LTD PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'a01b2469-9d74-4fa1-a760-cb2b3fa10d6c',
    '3G ELECTRICAL & DESIGN PTE LTD PTE. LTD.',
    'supplier',
    'contact@3gelectrical&designpteltdpteltd.com.sg',
    '81983520',
    '11, WOODLANDS CLOSE, ##09-05, WOODLANDS 11',
    '737853',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME11 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME11", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3gelectrical&designpteltdpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'a0316d0b-ceab-414c-bc5f-e66247fa5e4b',
    'a01b2469-9d74-4fa1-a760-cb2b3fa10d6c',
    'contact@3gelectrical&designpteltdpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3G',
    'ELECTRICAL &',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3GP SOLUTIONS PTE.LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '69fbe6d0-e824-472d-9f5e-4df28fa5b352',
    '3GP SOLUTIONS PTE.LTD.',
    'supplier',
    'contact@3gpsolutionspteltd.com.sg',
    '65143228',
    '1, THOMSON ROAD, ##04-326F, BALESTIER HILL SHOPPING CENTRE',
    '300001',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3gpsolutionspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '3561e024-9548-43bd-89e0-83acbebfbdb8',
    '69fbe6d0-e824-472d-9f5e-4df28fa5b352',
    'contact@3gpsolutionspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3GP',
    'SOLUTIONS PTE..',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3H AIRCONDITIONING & ENGINEERING PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '713acd88-295c-4d91-b7b4-1f1b6d98b3ac',
    '3H AIRCONDITIONING & ENGINEERING PTE LTD',
    'supplier',
    'contact@3hairconditioning&engineeringpteltd.com.sg',
    '64835702',
    '10, ADMIRALTY STREET, ##04-78, NORTH LINK BUILDING',
    '757695',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L2)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L2", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3hairconditioning&engineeringpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'b89cf062-c54c-495a-94d8-ad3386742a0d',
    '713acd88-295c-4d91-b7b4-1f1b6d98b3ac',
    'contact@3hairconditioning&engineeringpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3H',
    'AIRCONDITIONING &',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3H DECOR PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'd2291ffe-3a3a-4675-afe6-3cb8a67424b1',
    '3H DECOR PTE. LTD.',
    'supplier',
    'contact@3hdecorpteltd.com.sg',
    '68948944',
    '71, WOODLANDS INDUSTRIAL PARK E9, ##03-02, WAVE 9',
    '757048',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3hdecorpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'ac3ae9ad-9e2d-42b6-ba9c-dc9ca9881607',
    'd2291ffe-3a3a-4675-afe6-3cb8a67424b1',
    'contact@3hdecorpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3H',
    'DECOR',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3HA CONSTRUCTION PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '3285c2a8-52e4-4c75-9b49-de4b0c4b4fbe',
    '3HA CONSTRUCTION PTE LTD',
    'supplier',
    'contact@3haconstructionpteltd.com.sg',
    '96456315',
    '979, JURONG WEST STREET 93, ##03-325, na',
    '640979',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR09 (Grade: L1)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR09", "grade": "L1", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3haconstructionpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '2c74ebca-f50c-4fb2-98f6-213af1a58c5d',
    '3285c2a8-52e4-4c75-9b49-de4b0c4b4fbe',
    'contact@3haconstructionpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3HA',
    'CONSTRUCTION',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3I TECHNOLOGIES PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '4fbc7d6f-cbe7-4676-a2c2-b8d83aad182a',
    '3I TECHNOLOGIES PTE LTD',
    'supplier',
    'contact@3itechnologiespteltd.com.sg',
    '68626388',
    '8, BOON LAY WAY, ##05-04, 8@TRADEHUB 21',
    '609964',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME04 (Grade: L2)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME04", "grade": "L2", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3itechnologiespteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '4f3cb3b5-b0cb-436a-b82b-a006c0016980',
    '4fbc7d6f-cbe7-4676-a2c2-b8d83aad182a',
    'contact@3itechnologiespteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3I',
    'TECHNOLOGIES',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3ISTUDIO CONSULTANTS PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '0244d6ae-8318-46a7-a6d4-f6f828c67e2f',
    '3ISTUDIO CONSULTANTS PTE. LTD.',
    'supplier',
    'contact@3istudioconsultantspteltd.com.sg',
    '62731849',
    '5, JALAN KILANG BARAT, ##05-02, PETRO CENTRE',
    '159349',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CR06 (Grade: L3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CR06", "grade": "L3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3istudioconsultantspteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    '8a8196dc-ca94-480b-8154-b54151c5af8f',
    '0244d6ae-8318-46a7-a6d4-f6f828c67e2f',
    'contact@3istudioconsultantspteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3ISTUDIO',
    'CONSULTANTS',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3J CONSTRUCTION (S) PTE. LTD.
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    '8c774d02-5f68-4ef8-b5a8-1a78136556d7',
    '3J CONSTRUCTION (S) PTE. LTD.',
    'supplier',
    'contact@3jconstruction(s)pteltd.com.sg',
    '62542557',
    '39, WOODLANDS CLOSE, ##04-03/04, MEGA@WOODLANDS',
    '737856',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - ME01 (Grade: L3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "ME01", "grade": "L3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3jconstruction(s)pteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'a7b5c139-9098-4b2a-a0e0-138e5a01c648',
    '8c774d02-5f68-4ef8-b5a8-1a78136556d7',
    'contact@3jconstruction(s)pteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3J',
    'CONSTRUCTION (S)',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Supplier: 3L E&C PTE LTD
INSERT INTO tenants (
    id, name, type, email, phone, address, postal_code,
    status, is_active, metadata, created_at, updated_at
) VALUES (
    'cc809612-00c5-457b-8296-4396c5f0beb0',
    '3L E&C PTE LTD',
    'supplier',
    'contact@3le&cpteltd.com.sg',
    '88763339',
    '32, ANG MO KIO INDUSTRIAL PARK 2, ##06-06, SING INDUSTRIAL COMPLEX',
    '569510',
    'active',
    true,
    '{"registrationNumber": "", "contactPerson": "", "website": "", "taxId": "", "businessLicense": "", "description": "BCA Registered Contractor - CW01 (Grade: C3)", "city": "Singapore", "state": "", "country": "Singapore", "workhead": "CW01", "grade": "C3", "source": "BCA Registered Contractors"}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, tenants.phone),
    address = COALESCE(EXCLUDED.address, tenants.address),
    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Create user account for: contact@3le&cpteltd.com.sg
INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at
) VALUES (
    'b390b331-e199-45c0-a61e-a259565b26a2',
    'cc809612-00c5-457b-8296-4396c5f0beb0',
    'contact@3le&cpteltd.com.sg',
    crypt('Demo123!', gen_salt('bf', 12)),
    '3L',
    'E&C',
    'supplier_admin',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

COMMIT;

-- Summary
SELECT '=== IMPORT SUMMARY ===' as summary;

SELECT 
    COUNT(*) as total_suppliers,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address,
    COUNT(CASE WHEN postal_code IS NOT NULL THEN 1 END) as with_postal_code,
    COUNT(CASE WHEN postal_code IS NOT NULL AND LENGTH(postal_code) = 6 THEN 1 END) as with_valid_postal_code
FROM tenants
WHERE type = 'supplier'
  AND status = 'active';

-- Verify postal codes are in separate column (not in address)
SELECT 
    '=== POSTAL CODE VERIFICATION ===' as verification;

SELECT 
    name as company_name,
    address,
    postal_code,
    CASE 
        WHEN postal_code IS NOT NULL AND address IS NOT NULL THEN '✅ Both present'
        WHEN postal_code IS NULL THEN '⚠️ Missing postal code'
        WHEN address IS NULL THEN '⚠️ Missing address'
        ELSE '✅ OK'
    END as status
FROM tenants
WHERE type = 'supplier' AND status = 'active'
ORDER BY name
LIMIT 10;

-- Sample suppliers with login credentials and full address details
SELECT 
    t.name as company_name,
    u.email as login_email,
    'Demo123!' as demo_password,
    u.first_name || ' ' || u.last_name as contact_name,
    t.phone,
    t.address,
    t.postal_code,
    t.metadata->>'city' as city,
    t.metadata->>'country' as country
FROM tenants t
JOIN users u ON t.id = u.tenant_id
WHERE t.type = 'supplier' AND t.status = 'active'
ORDER BY t.created_at DESC
LIMIT 10;