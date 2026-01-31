-- Seed Demo Accounts for ConstructionGuru (OLD SCHEMA VERSION)
-- Use this if your database still has the old schema with 'role', 'tenant_id', 'status', etc.
-- Run this script to create demo QS and Supplier accounts

-- First, check if we need to create the tenant/organization records
-- For old schema, we need to create tenants first

-- Demo QS Company Tenant (old schema)
INSERT INTO tenants (id, name, type, email, status, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo QS Company',
  'company',
  'demo.qs@constructionguru.com',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Demo Supplier Tenant (old schema)
INSERT INTO tenants (id, name, type, email, status, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Demo Supplier Company',
  'supplier',
  'demo.supplier@constructionguru.com',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Demo QS User (password: DemoQS123!)
-- For old schema: use tenant_id, role='company_staff', status='active', is_active=true
INSERT INTO users (
  id, 
  tenant_id, 
  email, 
  password_hash, 
  first_name,
  last_name,
  role, 
  status, 
  is_active,
  created_at, 
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'demo.qs@constructionguru.com',
  '$2b$10$rK8X8X8X8X8X8X8X8X8Xe.8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', -- Replace with actual hash
  'Demo',
  'QS Professional',
  'company_staff',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Demo Supplier User (password: DemoSupplier123!)
-- For old schema: use tenant_id, role='supplier_staff', status='active', is_active=true
INSERT INTO users (
  id, 
  tenant_id, 
  email, 
  password_hash, 
  first_name,
  last_name,
  role, 
  status, 
  is_active,
  created_at, 
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000002',
  'demo.supplier@constructionguru.com',
  '$2b$10$rK8X8X8X8X8X8X8X8X8Xe.8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', -- Replace with actual hash
  'Demo',
  'Supplier',
  'supplier_staff',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = 'active',
    is_active = true,
    updated_at = NOW();

-- Note: The password hashes above are placeholders.
-- You need to generate actual bcrypt hashes for:
-- - DemoQS123! (for QS user)
-- - DemoSupplier123! (for Supplier user)
-- 
-- To generate hashes, use the Node.js script: node database/seed-demo-accounts.js
-- Or use Node.js directly:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('DemoQS123!', 10);
-- console.log(hash);
