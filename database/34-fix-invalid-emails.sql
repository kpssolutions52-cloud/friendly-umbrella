-- Fix Invalid Emails in Database
-- This script cleans up emails that contain invalid characters like apostrophes

-- Step 1: Find invalid emails
SELECT 
    '=== DIAGNOSTIC: Invalid Emails ===' as info;

SELECT 
    'organizations' as table_name,
    id::text as id,
    name,
    email,
    'Contains apostrophe' as issue
FROM organizations
WHERE email LIKE '%''%'
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]'

UNION ALL

SELECT 
    'users' as table_name,
    id::text as id,
    COALESCE(first_name || ' ' || last_name, name, email) as name,
    email,
    'Contains apostrophe' as issue
FROM users
WHERE email LIKE '%''%'
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]'

UNION ALL

SELECT 
    'tenants' as table_name,
    id::text as id,
    name,
    email,
    'Contains apostrophe' as issue
FROM tenants
WHERE email LIKE '%''%'
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]';

-- Step 2: Fix emails in organizations table
-- Remove apostrophes and other invalid characters, but keep valid email structure
UPDATE organizations
SET email = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(email, '''', '', 'g'),
        '''', '', 'g'
    ),
    '[^a-zA-Z0-9@._-]', '', 'g'
)
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email ~ '[^a-zA-Z0-9@._-]'
   OR email NOT LIKE '%@%.%';

-- Step 3: Fix emails in users table
UPDATE users
SET email = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(email, '''', '', 'g'),
        '''', '', 'g'
    ),
    '[^a-zA-Z0-9@._-]', '', 'g'
)
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email ~ '[^a-zA-Z0-9@._-]'
   OR email NOT LIKE '%@%.%';

-- Step 4: Fix emails in tenants table
UPDATE tenants
SET email = REGEXP_REPLACE(
    REGEXP_REPLACE(
        REGEXP_REPLACE(email, '''', '', 'g'),
        '''', '', 'g'
    ),
    '[^a-zA-Z0-9@._-]', '', 'g'
)
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email ~ '[^a-zA-Z0-9@._-]'
   OR email NOT LIKE '%@%.%';

-- Step 5: Verify fixes
SELECT 
    '=== VERIFICATION: Remaining Invalid Emails ===' as info;

SELECT 
    'organizations' as table_name,
    COUNT(*) as "Remaining Invalid Count"
FROM organizations
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]'

UNION ALL

SELECT 
    'users' as table_name,
    COUNT(*) as "Remaining Invalid Count"
FROM users
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]'

UNION ALL

SELECT 
    'tenants' as table_name,
    COUNT(*) as "Remaining Invalid Count"
FROM tenants
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]';

-- Step 6: Show detailed invalid emails for manual review
SELECT 
    '=== DETAILED: Invalid Emails (Manual Review Needed) ===' as info;

SELECT 
    'organizations' as table_name,
    id::text as id,
    name,
    email as "Current Email",
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(email, '''', '', 'g'),
            '''', '', 'g'
        ),
        '[^a-zA-Z0-9@._-]', '', 'g'
    ) as "Suggested Fix"
FROM organizations
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]'

UNION ALL

SELECT 
    'users' as table_name,
    id::text as id,
    COALESCE(first_name || ' ' || last_name, name, email) as name,
    email as "Current Email",
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(email, '''', '', 'g'),
            '''', '', 'g'
        ),
        '[^a-zA-Z0-9@._-]', '', 'g'
    ) as "Suggested Fix"
FROM users
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]'

UNION ALL

SELECT 
    'tenants' as table_name,
    id::text as id,
    name,
    email as "Current Email",
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(email, '''', '', 'g'),
            '''', '', 'g'
        ),
        '[^a-zA-Z0-9@._-]', '', 'g'
    ) as "Suggested Fix"
FROM tenants
WHERE email LIKE '%''%' 
   OR email LIKE '%''%'
   OR email NOT LIKE '%@%.%'
   OR email ~ '[^a-zA-Z0-9@._-]';

-- Step 7: Show summary
SELECT 
    '=== SUMMARY ===' as info;

SELECT 
    (SELECT COUNT(*) FROM organizations WHERE email NOT LIKE '%@%.%' OR email ~ '[^a-zA-Z0-9@._-]') as "Invalid Organization Emails",
    (SELECT COUNT(*) FROM users WHERE email NOT LIKE '%@%.%' OR email ~ '[^a-zA-Z0-9@._-]') as "Invalid User Emails",
    (SELECT COUNT(*) FROM tenants WHERE email NOT LIKE '%@%.%' OR email ~ '[^a-zA-Z0-9@._-]') as "Invalid Tenant Emails";
