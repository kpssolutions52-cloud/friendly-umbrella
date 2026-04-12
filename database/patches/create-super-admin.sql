-- Script: Create Super Admin Account
-- Execute this in Supabase SQL Editor
-- 
-- ✅ CREDENTIALS:
-- Email: admin@construction-pricing.com
-- Password: Admin123!@#
-- 
-- After running this script, you can login at:
-- POST https://friendly-umbrella-production.up.railway.app/api/v1/auth/login
-- Body: {"email": "admin@construction-pricing.com", "password": "Admin123!@#"}

INSERT INTO "users" (
    "id",
    "email",
    "password_hash",
    "first_name",
    "last_name",
    "role",
    "status",
    "is_active",
    "tenant_id",
    "permissions",
    "created_at",
    "updated_at"
) VALUES (
    gen_random_uuid(),
    'admin@construction-pricing.com',
    '$2a$12$jH./oplI9NgMc7E864.HsOy59hcfxYZhu7RJSyL5UN/spZ/ijjvSy',
    'Super',
    'Admin',
    'super_admin',
    'active',
    true,
    NULL,
    '{}',
    NOW(),
    NOW()
)
ON CONFLICT ("email") DO UPDATE SET
    "role" = 'super_admin',
    "status" = 'active',
    "is_active" = true,
    "tenant_id" = NULL;

