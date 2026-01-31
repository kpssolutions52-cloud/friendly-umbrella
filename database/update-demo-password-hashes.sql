-- Update Demo Account Password Hashes
-- Run this after seeding to set actual bcrypt hashes
-- These hashes are generated for:
-- - DemoQS123! (QS user)
-- - DemoSupplier123! (Supplier user)

-- Note: These hashes are generated using bcrypt with 10 rounds
-- To generate new hashes, use: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password', 10).then(h => console.log(h));"

-- Update QS Demo User Password (DemoQS123!)
UPDATE users
SET password_hash = '$2a$10$CY0uahKHmqnV5k8c4sfSAOhXjrNHT0CEx8.dcTqs2m0GA/kj6.qp6'
WHERE email = 'demo.qs@constructionguru.com';

-- Update Supplier Demo User Password (DemoSupplier123!)
-- Hash: $2a$10$B26rNgjBZlpFfnj9ej/U3eZeOANMsCPYNMVGNeY6ZeAAuFg48szEa
UPDATE users
SET password_hash = '$2a$10$B26rNgjBZlpFfnj9ej/U3eZeOANMsCPYNMVGNeY6ZeAAuFg48szEa'
WHERE email = 'demo.supplier@constructionguru.com';

-- Note: The hashes above are still placeholders.
-- You need to generate actual bcrypt hashes using the Node.js script:
-- node database/seed-demo-accounts.js
-- 
-- Or manually generate hashes:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('DemoQS123!', 10).then(h => console.log('QS:', h));"
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('DemoSupplier123!', 10).then(h => console.log('Supplier:', h));"
