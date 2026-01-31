-- Fix Demo Account Password Hashes
-- This script updates the password hashes and trims any whitespace

-- Update QS Demo User Password (DemoQS123!)
-- Hash: $2a$10$CY0uahKHmqnV5k8c4sfSAOhXjrNHT0CEx8.dcTqs2m0GA/kj6.qp6
UPDATE users
SET password_hash = '$2a$10$CY0uahKHmqnV5k8c4sfSAOhXjrNHT0CEx8.dcTqs2m0GA/kj6.qp6'
WHERE email = 'demo.qs@constructionguru.com';

-- Update Supplier Demo User Password (DemoSupplier123!)
-- Hash: $2a$10$B26rNgjBZlpFfnj9ej/U3eZeOANMsCPYNMVGNeY6ZeAAuFg48szEa
UPDATE users
SET password_hash = '$2a$10$B26rNgjBZlpFfnj9ej/U3eZeOANMsCPYNMVGNeY6ZeAAuFg48szEa'
WHERE email = 'demo.supplier@constructionguru.com';

-- Verify the updates
SELECT 
  email,
  LENGTH(password_hash) as hash_length,
  password_hash
FROM users
WHERE email IN ('demo.qs@constructionguru.com', 'demo.supplier@constructionguru.com');

-- Expected: Both hashes should be exactly 60 characters long
