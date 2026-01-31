/**
 * Seed Demo Accounts Script
 * 
 * This script creates demo QS and Supplier accounts for testing.
 * Run with: node database/seed-demo-accounts.js
 * 
 * Make sure DATABASE_URL is set in your environment.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_ACCOUNTS = {
  qs: {
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationName: 'Demo QS Company',
    organizationType: 'company',
    organizationEmail: 'demo.qs@constructionguru.com',
    userId: '00000000-0000-0000-0000-000000000011',
    userEmail: 'demo.qs@constructionguru.com',
    userPassword: 'DemoQS123!',
    userName: 'Demo QS Professional',
    userType: 'qs',
  },
  supplier: {
    organizationId: '00000000-0000-0000-0000-000000000002',
    organizationName: 'Demo Supplier Company',
    organizationType: 'supplier',
    organizationEmail: 'demo.supplier@constructionguru.com',
    userId: '00000000-0000-0000-0000-000000000012',
    userEmail: 'demo.supplier@constructionguru.com',
    userPassword: 'DemoSupplier123!',
    userName: 'Demo Supplier',
    userType: 'supplier',
  },
};

async function seedDemoAccounts() {
  console.log('🌱 Starting demo accounts seed...\n');

  try {
    // Check which schema we're using by checking if 'organizations' table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'tenants')
    `;
    
    const hasNewSchema = tables.some((t: any) => t.table_name === 'organizations');
    const hasOldSchema = tables.some((t: any) => t.table_name === 'tenants');
    
    console.log(`Schema detected: ${hasNewSchema ? 'NEW (simplified)' : 'OLD (with tenants)'}\n`);

    for (const [accountType, account] of Object.entries(DEMO_ACCOUNTS)) {
      console.log(`Creating ${accountType} demo account...`);

      // Hash password
      const passwordHash = await bcrypt.hash(account.userPassword, 10);

      if (hasNewSchema) {
        // NEW SCHEMA: Use organizations and users with type field
        const organization = await prisma.organization.upsert({
          where: { email: account.organizationEmail },
          update: {
            name: account.organizationName,
            type: account.organizationType,
            updatedAt: new Date(),
          },
          create: {
            id: account.organizationId,
            name: account.organizationName,
            type: account.organizationType,
            email: account.organizationEmail,
          },
        });

        console.log(`  ✅ Organization: ${organization.name} (${organization.id})`);

        const user = await prisma.user.upsert({
          where: { email: account.userEmail },
          update: {
            organizationId: organization.id,
            passwordHash,
            name: account.userName,
            type: account.userType,
            updatedAt: new Date(),
          },
          create: {
            id: account.userId,
            organizationId: organization.id,
            email: account.userEmail,
            passwordHash,
            name: account.userName,
            type: account.userType,
          },
        });

        console.log(`  ✅ User: ${user.name} (${user.email})`);
      } else if (hasOldSchema) {
        // OLD SCHEMA: Use tenants and users with role field
        // Map userType to role
        const role = account.userType === 'qs' ? 'company_staff' : 'supplier_staff';
        
        // Check if Tenant model exists (it might be in Prisma schema)
        try {
          // Try to use tenant if it exists in Prisma
          const tenant = await (prisma as any).tenant.upsert({
            where: { email: account.organizationEmail },
            update: {
              name: account.organizationName,
              type: account.organizationType,
              status: 'active',
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              id: account.organizationId,
              name: account.organizationName,
              type: account.organizationType,
              email: account.organizationEmail,
              status: 'active',
              isActive: true,
            },
          });

          console.log(`  ✅ Tenant: ${tenant.name} (${tenant.id})`);

          const user = await (prisma as any).user.upsert({
            where: { email: account.userEmail },
            update: {
              tenantId: tenant.id,
              passwordHash,
              firstName: account.userName.split(' ')[0] || 'Demo',
              lastName: account.userName.split(' ').slice(1).join(' ') || accountType === 'qs' ? 'QS Professional' : 'Supplier',
              role,
              status: 'active',
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              id: account.userId,
              tenantId: tenant.id,
              email: account.userEmail,
              passwordHash,
              firstName: account.userName.split(' ')[0] || 'Demo',
              lastName: account.userName.split(' ').slice(1).join(' ') || accountType === 'qs' ? 'QS Professional' : 'Supplier',
              role,
              status: 'active',
              isActive: true,
            },
          });

          console.log(`  ✅ User: ${user.firstName} ${user.lastName} (${user.email})`);
        } catch (error: any) {
          console.error(`  ❌ Error with old schema: ${error.message}`);
          console.error(`  💡 Try running the database migration first, or use the SQL script: database/seed-demo-accounts-old-schema.sql`);
          throw error;
        }
      } else {
        throw new Error('Neither new nor old schema detected. Please check your database setup.');
      }

      console.log(`  📧 Email: ${account.userEmail}`);
      console.log(`  🔑 Password: ${account.userPassword}\n`);
    }

    console.log('✅ Demo accounts seeded successfully!');
    console.log('\nDemo Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('QS Professional:');
    console.log(`  Email: ${DEMO_ACCOUNTS.qs.userEmail}`);
    console.log(`  Password: ${DEMO_ACCOUNTS.qs.userPassword}`);
    console.log('\nSupplier:');
    console.log(`  Email: ${DEMO_ACCOUNTS.supplier.userEmail}`);
    console.log(`  Password: ${DEMO_ACCOUNTS.supplier.userPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error seeding demo accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoAccounts()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoAccounts, DEMO_ACCOUNTS };
