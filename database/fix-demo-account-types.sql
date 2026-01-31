-- Fix demo account user types
-- demo.supplier@constructionguru.com should be 'supplier'
-- demo.qs@constructionguru.com should be 'qs'

-- Step 1: Check current state
SELECT 
    email,
    type,
    organization_id,
    (SELECT name FROM organizations WHERE id = users.organization_id) as org_name,
    (SELECT type FROM organizations WHERE id = users.organization_id) as org_type
FROM users
WHERE email IN ('demo.supplier@constructionguru.com', 'demo.qs@constructionguru.com');

-- Step 2: Fix demo supplier account type
UPDATE users
SET type = 'supplier'::usertype
WHERE email = 'demo.supplier@constructionguru.com'
AND type != 'supplier';

-- Step 3: Ensure demo QS account type is correct
UPDATE users
SET type = 'qs'::usertype
WHERE email = 'demo.qs@constructionguru.com'
AND type != 'qs';

-- Step 4: Verify the fix
SELECT 
    email,
    type,
    organization_id,
    (SELECT name FROM organizations WHERE id = users.organization_id) as org_name,
    (SELECT type FROM organizations WHERE id = users.organization_id) as org_type
FROM users
WHERE email IN ('demo.supplier@constructionguru.com', 'demo.qs@constructionguru.com');

-- Expected result:
-- demo.supplier@constructionguru.com | supplier | [org_id] | [org_name] | supplier
-- demo.qs@constructionguru.com       | qs       | [org_id] | [org_name] | company
