-- Import Singapore Contractors/Subcontractors as Demo QS Professional Company Profiles
-- This script creates organizations (type='company') and users (type='qs') for demo purposes
-- Demo Password for all QS Professional accounts: Demo123!
--
-- Data Source: Based on Singapore BCA Registered Contractors and common subcontractor patterns
-- Generated: 2024

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure UserRole and UserStatus enums exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('super_admin', 'supplier_admin', 'supplier_staff', 'company_admin', 'company_staff');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'rejected', 'inactive');
    END IF;
END $$;

BEGIN;

-- ============================================================================
-- SINGAPORE CONTRACTORS & SUBCONTRACTORS AS QS PROFESSIONAL COMPANIES
-- ============================================================================

-- Helper function to create organization and user
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    -- Company 1: Apex Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Apex Construction Pte Ltd',
        'company'::"OrgType",
        'contact@apexconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    RETURNING id INTO org_id;

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@apexconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@apexconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 2: BuildTech Engineering Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'BuildTech Engineering Pte Ltd',
        'company'::"OrgType",
        'contact@buildtech.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@buildtech.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@buildtech.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 3: City Builders & Contractors Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'City Builders & Contractors Pte Ltd',
        'company'::"OrgType",
        'contact@citybuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@citybuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@citybuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 4: Delta Construction Services Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Delta Construction Services Pte Ltd',
        'company'::"OrgType",
        'contact@deltaconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@deltaconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@deltaconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 5: Elite Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Elite Builders Pte Ltd',
        'company'::"OrgType",
        'contact@elitebuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@elitebuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@elitebuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 6: Fortress Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Fortress Construction Pte Ltd',
        'company'::"OrgType",
        'contact@fortressconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@fortressconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@fortressconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 7: Global Builders & Engineers Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Global Builders & Engineers Pte Ltd',
        'company'::"OrgType",
        'contact@globalbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@globalbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@globalbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 8: Horizon Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Horizon Construction Pte Ltd',
        'company'::"OrgType",
        'contact@horizonconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@horizonconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@horizonconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 9: Integrated Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Integrated Builders Pte Ltd',
        'company'::"OrgType",
        'contact@integratedbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@integratedbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@integratedbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 10: Jaya Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Jaya Construction Pte Ltd',
        'company'::"OrgType",
        'contact@jayaconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@jayaconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@jayaconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 11: Keystone Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Keystone Builders Pte Ltd',
        'company'::"OrgType",
        'contact@keystonebuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@keystonebuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@keystonebuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 12: Lian Hup Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Lian Hup Construction Pte Ltd',
        'company'::"OrgType",
        'contact@lianhup.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@lianhup.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@lianhup.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 13: Metro Builders & Contractors Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Metro Builders & Contractors Pte Ltd',
        'company'::"OrgType",
        'contact@metrobuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@metrobuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@metrobuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 14: Nexus Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Nexus Construction Pte Ltd',
        'company'::"OrgType",
        'contact@nexusconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@nexusconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@nexusconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 15: Orion Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Orion Builders Pte Ltd',
        'company'::"OrgType",
        'contact@orionbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@orionbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@orionbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 16: Pacific Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Pacific Construction Pte Ltd',
        'company'::"OrgType",
        'contact@pacificconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@pacificconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@pacificconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 17: Quantum Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Quantum Builders Pte Ltd',
        'company'::"OrgType",
        'contact@quantumbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@quantumbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@quantumbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 18: Reliance Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Reliance Construction Pte Ltd',
        'company'::"OrgType",
        'contact@relianceconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@relianceconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@relianceconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 19: Summit Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Summit Builders Pte Ltd',
        'company'::"OrgType",
        'contact@summitbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@summitbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@summitbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 20: Titan Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Titan Construction Pte Ltd',
        'company'::"OrgType",
        'contact@titanconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@titanconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@titanconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 21: United Builders & Contractors Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'United Builders & Contractors Pte Ltd',
        'company'::"OrgType",
        'contact@unitedbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@unitedbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@unitedbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 22: Vertex Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Vertex Construction Pte Ltd',
        'company'::"OrgType",
        'contact@vertexconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@vertexconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@vertexconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 23: Winson Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Winson Construction Pte Ltd',
        'company'::"OrgType",
        'contact@winsonconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@winsonconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@winsonconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 24: Xcel Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Xcel Builders Pte Ltd',
        'company'::"OrgType",
        'contact@xcelbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@xcelbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@xcelbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 25: Yew Seng Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Yew Seng Construction Pte Ltd',
        'company'::"OrgType",
        'contact@yewseng.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@yewseng.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@yewseng.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 26: Zenith Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Zenith Builders Pte Ltd',
        'company'::"OrgType",
        'contact@zenithbuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@zenithbuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@zenithbuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 27: Alpha Subcontractors Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Alpha Subcontractors Pte Ltd',
        'company'::"OrgType",
        'contact@alphasubcontractors.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@alphasubcontractors.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@alphasubcontractors.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 28: Beta Contractors Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Beta Contractors Pte Ltd',
        'company'::"OrgType",
        'contact@betacontractors.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@betacontractors.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@betacontractors.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 29: Gamma Builders Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Gamma Builders Pte Ltd',
        'company'::"OrgType",
        'contact@gammabuilders.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@gammabuilders.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@gammabuilders.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();

    -- Company 30: Omega Construction Pte Ltd
    INSERT INTO organizations (id, name, type, email, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Omega Construction Pte Ltd',
        'company'::"OrgType",
        'contact@omegaconstruction.sg',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    INSERT INTO users (id, organization_id, email, password_hash, name, type, role, status, is_active, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        o.id,
        'qs@omegaconstruction.sg',
        crypt('Demo123!', gen_salt('bf', 12)),
        'QS Professional',
        'qs'::"UserType",
        'company_admin'::"UserRole",
        'active'::"UserStatus",
        true,
        NOW(),
        NOW()
    FROM organizations o
    WHERE o.email = 'contact@omegaconstruction.sg'
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'company_admin'::"UserRole",
        status = 'active'::"UserStatus",
        is_active = true,
        updated_at = NOW();
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 
    '=== SUMMARY: QS Professional Companies Created ===' as info;

SELECT 
    COUNT(*) as "Total QS Professional Companies",
    COUNT(DISTINCT u.id) as "Total QS Professional Users"
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id AND u.type = 'qs'
WHERE o.type = 'company';

SELECT 
    '=== LIST OF QS PROFESSIONAL COMPANIES ===' as info;

SELECT 
    o.name as "Company Name",
    o.email as "Company Email",
    u.email as "QS User Email",
    u.name as "QS User Name",
    u.role as "Role",
    u.status as "Status"
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id AND u.type = 'qs'
WHERE o.type = 'company'
ORDER BY o.name;

SELECT 
    '=== DEMO LOGIN CREDENTIALS (First 10) ===' as info;

SELECT 
    o.name as "Company",
    u.email as "Email",
    'Demo123!' as "Password"
FROM organizations o
JOIN users u ON u.organization_id = o.id
WHERE o.type = 'company' AND u.type = 'qs'
ORDER BY o.name
LIMIT 10;
