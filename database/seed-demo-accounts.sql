-- Seed Demo Accounts for ConstructionGuru
-- Run this script to create demo QS and Supplier accounts
-- These accounts allow users to try the platform without registration

-- Demo QS Company Organization
INSERT INTO organizations (id, name, type, email, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo QS Company',
  'company',
  'demo.qs@constructionguru.com',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    updated_at = NOW();

-- Demo Supplier Organization
INSERT INTO organizations (id, name, type, email, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Demo Supplier Company',
  'supplier',
  'demo.supplier@constructionguru.com',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    updated_at = NOW();

-- Demo QS User (password: DemoQS123!)
-- Password hash generated using bcrypt with 10 rounds
INSERT INTO users (id, organization_id, email, password_hash, name, type, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'demo.qs@constructionguru.com',
  '$2b$10$rK8X8X8X8X8X8X8X8X8Xe.8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', -- This will be replaced with actual hash
  'Demo QS Professional',
  'qs',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    updated_at = NOW();

-- Demo Supplier User (password: DemoSupplier123!)
-- Password hash generated using bcrypt with 10 rounds
INSERT INTO users (id, organization_id, email, password_hash, name, type, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000002',
  'demo.supplier@constructionguru.com',
  '$2b$10$rK8X8X8X8X8X8X8X8X8Xe.8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X', -- This will be replaced with actual hash
  'Demo Supplier',
  'supplier',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    updated_at = NOW();

-- Note: The password hashes above are placeholders.
-- You need to generate actual bcrypt hashes for:
-- - DemoQS123! (for QS user)
-- - DemoSupplier123! (for Supplier user)
-- 
-- To generate hashes, you can use Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('DemoQS123!', 10);
-- console.log(hash);
