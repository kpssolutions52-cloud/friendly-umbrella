-- Verify Demo Accounts Setup
-- Run this to check if demo accounts are properly configured

-- Check if accounts exist and their status
SELECT 
  u.email,
  u.role,
  u.status,
  u.is_active,
  CASE 
    WHEN u.password_hash LIKE '$2a$10$%' OR u.password_hash LIKE '$2b$10$%' THEN 'Valid bcrypt hash'
    WHEN u.password_hash LIKE '$2a$10$rK8X%' OR u.password_hash LIKE '$2b$10$rK8X%' THEN 'Placeholder hash (needs update)'
    ELSE 'Invalid hash format'
  END as hash_status,
  LENGTH(u.password_hash) as hash_length,
  t.name as tenant_name,
  t.type as tenant_type,
  t.status as tenant_status,
  t.is_active as tenant_is_active
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email IN ('demo.qs@constructionguru.com', 'demo.supplier@constructionguru.com')
ORDER BY u.email;

-- Expected results:
-- Both accounts should have:
-- - status = 'active'
-- - is_active = true
-- - hash_status = 'Valid bcrypt hash'
-- - hash_length = 60
-- - tenant_status = 'active'
-- - tenant_is_active = true
