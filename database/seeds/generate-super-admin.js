// Script to generate super admin SQL with proper bcrypt hash
// Run: node database/generate-super-admin.js

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const email = 'admin@construction-pricing.com';
const password = 'Admin123!@#';
const firstName = 'Super';
const lastName = 'Admin';

async function generateSuperAdmin() {
  console.log('🔐 Generating super admin account...\n');
  
  // Generate password hash
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  
  // Generate SQL
  const sql = `-- Super Admin Account
-- Execute this in Supabase SQL Editor

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
    '${userId}',
    '${email}',
    '${passwordHash}',
    '${firstName}',
    '${lastName}',
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

-- ✅ Super Admin Created Successfully!
-- 
-- Credentials:
-- Email: ${email}
-- Password: ${password}
-- 
-- You can now login at:
-- POST https://friendly-umbrella-production.up.railway.app/api/v1/auth/login
-- Body: {"email": "${email}", "password": "${password}"}
`;

  console.log('📋 SQL Script:\n');
  console.log(sql);
  console.log('\n✅ Copy the SQL above and run it in Supabase SQL Editor\n');
  console.log('🔑 Credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}\n`);
}

generateSuperAdmin().catch(console.error);

