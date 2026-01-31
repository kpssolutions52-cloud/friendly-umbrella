-- Update Demo Account Password Hashes
-- Run this after seeding to set actual bcrypt hashes
-- These hashes are generated for:
-- - DemoQS123! (QS user)
-- - DemoSupplier123! (Supplier user)

-- Note: These hashes are generated using bcrypt with 10 rounds
-- To generate new hashes, use: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password', 10).then(h => console.log(h));"

-- Update QS Demo User Password (DemoQS123!)
UPDATE users
SET password_hash = '$2a$10$PocqDPcRsoyxbTw6bHWJPufiF.SI.eEEs9kAymNRF4K5.WfQA6VIK'
WHERE email = 'demo.qs@constructionguru.com';

-- Update Supplier Demo User Password (DemoSupplier123!)
UPDATE users
SET password_hash = '$2a$10$zE3zSl896jCRFPVDoMw2fOzW36wHdR2VF0W4ZzmG9G931SJKk.z6q'
WHERE email = 'demo.supplier@constructionguru.com';

-- Note: The hashes above are still placeholders.
-- You need to generate actual bcrypt hashes using the Node.js script:
-- node database/seed-demo-accounts.js
-- 
-- Or manually generate hashes:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('DemoQS123!', 10).then(h => console.log('QS:', h));"
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('DemoSupplier123!', 10).then(h => console.log('Supplier:', h));"
