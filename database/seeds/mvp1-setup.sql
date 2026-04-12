-- ============================================================================
-- MVP 1 Database Setup Script
-- ============================================================================
-- This script sets up the database for MVP 1
-- Run this if you're starting fresh or after backing up existing data
-- ============================================================================

-- Step 1: Create required enums (if they don't exist)
DO $$ 
BEGIN
    -- OrgType enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_type') THEN
        CREATE TYPE org_type AS ENUM ('company', 'supplier');
    END IF;
    
    -- UserType enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('qs', 'supplier');
    END IF;
    
    -- ProjectStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
    END IF;
    
    -- QuoteStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');
    END IF;
    
    -- QuoteRequestStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_request_status') THEN
        CREATE TYPE quote_request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
    END IF;
    
    -- QuoteResponseStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_response_status') THEN
        CREATE TYPE quote_response_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'negotiating', 'expired');
    END IF;
    
    -- NegotiationStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'negotiation_status') THEN
        CREATE TYPE negotiation_status AS ENUM ('open', 'accepted', 'rejected', 'counter_offered');
    END IF;
    
    -- OrderStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'in_production', 'ready_for_delivery', 'in_transit', 'delivered', 'quality_check', 'quality_approved', 'quality_rejected', 'completed', 'cancelled');
    END IF;
    
    -- DeliveryStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
        CREATE TYPE delivery_status AS ENUM ('scheduled', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'failed');
    END IF;
    
    -- QualityStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quality_status') THEN
        CREATE TYPE quality_status AS ENUM ('pending', 'passed', 'failed', 'conditional');
    END IF;
    
    -- CertificateType enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_type') THEN
        CREATE TYPE certificate_type AS ENUM ('material_certificate', 'test_certificate', 'quality_certificate', 'compliance_certificate', 'warranty_certificate');
    END IF;
    
    -- CertificateStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_status') THEN
        CREATE TYPE certificate_status AS ENUM ('requested', 'submitted', 'under_review', 'approved', 'rejected');
    END IF;
    
    -- PaymentStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'processed', 'completed', 'failed', 'cancelled');
    END IF;
END $$;

-- Step 2: Create Organizations table (MVP 1 Core)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type org_type NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

-- Step 3: Create Users table (MVP 1 Core)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    type user_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);

-- Step 4: Create Products table (MVP 1 Core)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_products_price CHECK (price > 0)
);

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Step 5: Create Company Prices table (MVP 1 Core - for company-specific pricing)
CREATE TABLE IF NOT EXISTS company_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    company_id UUID NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_prices_product FOREIGN KEY (product_id) 
        REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_company_prices_company FOREIGN KEY (company_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_company_prices_price CHECK (price > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_prices_unique ON company_prices(product_id, company_id, effective_from);
CREATE INDEX IF NOT EXISTS idx_company_prices_product_id ON company_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_company_prices_company_id ON company_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_company_prices_effective_from ON company_prices(effective_from);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'MVP 1 core tables created successfully!';
    RAISE NOTICE 'Tables: organizations, users, products, company_prices';
    RAISE NOTICE 'Next: Run npx prisma generate in packages/backend';
END $$;
