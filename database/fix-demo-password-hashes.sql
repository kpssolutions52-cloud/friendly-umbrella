-- Fix Demo Account Password Hashes
-- This script updates the password hashes and trims any whitespace

-- Update QS Demo User Password (DemoQS123!)
-- Hash: $2a$10$PocqDPcRsoyxbTw6bHWJPufiF.SI.eEEs9kAymNRF4K5.WfQA6VIK
UPDATE users
SET password_hash = TRIM('$2a$10$PocqDPcRsoyxbTw6bHWJPufiF.SI.eEEs9kAymNRF4K5.WfQA6VIK')
WHERE email = 'demo.qs@constructionguru.com';

-- Update Supplier Demo User Password (DemoSupplier123!)
-- Hash: $2a$10$zE3zSl896jCRFPVDoMw2fOzW36wHdR2VF0W4ZzmG9G931SJKk.z6q
UPDATE users
SET password_hash = TRIM('$2a$10$zE3zSl896jCRFPVDoMw2fOzW36wHdR2VF0W4ZzmG9G931SJKk.z6q')
WHERE email = 'demo.supplier@constructionguru.com';

-- Verify the updates
SELECT 
  email,
  LENGTH(password_hash) as hash_length,
  password_hash
FROM users
WHERE email IN ('demo.qs@constructionguru.com', 'demo.supplier@constructionguru.com');

-- Expected: Both hashes should be exactly 60 characters long
