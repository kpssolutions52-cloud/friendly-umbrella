-- ============================================================================
-- MIGRATION 02: Create New Simplified Schema
-- ============================================================================
-- This creates the new simplified schema (3 tables: organizations, users, products)
-- Run this AFTER backup is complete
-- ============================================================================

-- Create new Organizations table (replaces Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('company', 'supplier')),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on organization type
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

-- Create new Users table (simplified)
CREATE TABLE IF NOT EXISTS users_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    type VARCHAR(20) NOT NULL CHECK (type IN ('qs', 'supplier')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create indexes on users_new
CREATE INDEX IF NOT EXISTS idx_users_new_organization_id ON users_new(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_new_email ON users_new(email);
CREATE INDEX IF NOT EXISTS idx_users_new_type ON users_new(type);

-- Create new Products table (simplified)
CREATE TABLE IF NOT EXISTS products_new (
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

-- Create indexes on products_new
CREATE INDEX IF NOT EXISTS idx_products_new_supplier_id ON products_new(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_new_name ON products_new(name);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'New simplified schema created successfully.';
    RAISE NOTICE 'Tables created: organizations, users_new, products_new';
END $$;
