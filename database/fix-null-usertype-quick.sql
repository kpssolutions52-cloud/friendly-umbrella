-- QUICK FIX: Update null UserType values
-- Assumes enum type already exists and column is enum type

-- Update null values based on organization type
UPDATE users u
SET type = CASE 
    WHEN o.type = 'company' THEN 'qs'::usertype
    WHEN o.type = 'supplier' THEN 'supplier'::usertype
    ELSE 'qs'::usertype
END
FROM organizations o
WHERE u.organization_id = o.id
AND u.type IS NULL;

-- Set default for any remaining nulls
UPDATE users
SET type = 'qs'::usertype
WHERE type IS NULL;

-- Verify
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE type = 'qs') as qs,
    COUNT(*) FILTER (WHERE type = 'supplier') as supplier,
    COUNT(*) FILTER (WHERE type IS NULL) as nulls
FROM users;
