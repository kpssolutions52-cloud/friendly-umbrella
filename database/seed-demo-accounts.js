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
    for (const [accountType, account] of Object.entries(DEMO_ACCOUNTS)) {
      console.log(`Creating ${accountType} demo account...`);

      // Hash password
      const passwordHash = await bcrypt.hash(account.userPassword, 10);

      // Create or update organization
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

      // Create or update user
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
