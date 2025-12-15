import { setupInMemoryDatabase, cleanInMemoryDatabase, closeInMemoryDatabase, getE2EPrisma } from '../../packages/backend/src/e2e/db-setup';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

let isInitialized = false;

/**
 * Initialize database for E2E tests using TestContainers
 */
export async function initE2EDatabase(): Promise<PrismaClient> {
  if (!isInitialized) {
    // Initialize TestContainers database
    const prisma = await setupInMemoryDatabase();
    await seedTestData(prisma);
    isInitialized = true;
    return prisma;
  }
  return getE2EPrisma();
}

/**
 * Seed test data using Prisma (works with real PostgreSQL from TestContainers)
 */
async function seedTestData(prisma: PrismaClient) {
  console.log('🌱 Seeding test data...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('password123', 10);

  try {
    // Check if super admin exists, if not create it
    let superAdmin = await prisma.user.findUnique({
      where: { email: 'admin@system.com' },
    });
    
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          email: 'admin@system.com',
          passwordHash: adminPasswordHash,
          role: 'super_admin',
          status: 'active',
          isActive: true,
          firstName: 'Super',
          lastName: 'Admin',
        },
      });
    }

    // Create test supplier
    let supplier = await prisma.tenant.findUnique({
      where: { email: 'supplier@example.com' },
    });
    
    if (!supplier) {
      supplier = await prisma.tenant.create({
        data: {
          name: 'Test Supplier',
          type: 'supplier',
          email: 'supplier@example.com',
          phone: '+1234567890',
          address: '123 Supplier St',
          postalCode: '12345',
          status: 'active',
          isActive: true,
        },
      });
    }

    // Create supplier admin
    let supplierAdmin = await prisma.user.findUnique({
      where: { email: 'supplier@example.com' },
    });
    
    if (!supplierAdmin) {
      await prisma.user.create({
        data: {
          tenantId: supplier.id,
          email: 'supplier@example.com',
          passwordHash: userPasswordHash,
          role: 'supplier_admin',
          status: 'active',
          isActive: true,
          firstName: 'Supplier',
          lastName: 'Admin',
        },
      });
    }

    // Create test company
    let company = await prisma.tenant.findUnique({
      where: { email: 'company@example.com' },
    });
    
    if (!company) {
      company = await prisma.tenant.create({
        data: {
          name: 'Test Company',
          type: 'company',
          email: 'company@example.com',
          phone: '+1234567891',
          address: '456 Company Ave',
          postalCode: '54321',
          status: 'active',
          isActive: true,
        },
      });
    }

    // Create company admin
    let companyAdmin = await prisma.user.findUnique({
      where: { email: 'company@example.com' },
    });
    
    if (!companyAdmin) {
      await prisma.user.create({
        data: {
          tenantId: company.id,
          email: 'company@example.com',
          passwordHash: userPasswordHash,
          role: 'company_admin',
          status: 'active',
          isActive: true,
          firstName: 'Company',
          lastName: 'Admin',
        },
      });
    }

    // Create test customer
    let customer = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    
    if (!customer) {
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: userPasswordHash,
          role: 'customer',
          status: 'active',
          isActive: true,
          firstName: 'Test',
          lastName: 'User',
        },
      });
    }

    // Create service provider
    let serviceProvider = await prisma.tenant.findUnique({
      where: { email: 'service@example.com' },
    });
    
    if (!serviceProvider) {
      serviceProvider = await prisma.tenant.create({
        data: {
          name: 'Test Service Provider',
          type: 'service_provider',
          email: 'service@example.com',
          phone: '+1234567892',
          address: '789 Service Blvd',
          postalCode: '67890',
          status: 'active',
          isActive: true,
        },
      });
    }

    // Create service provider admin
    let serviceProviderAdmin = await prisma.user.findUnique({
      where: { email: 'service@example.com' },
    });
    
    if (!serviceProviderAdmin) {
      await prisma.user.create({
        data: {
          tenantId: serviceProvider.id,
          email: 'service@example.com',
          passwordHash: userPasswordHash,
          role: 'service_provider_admin',
          status: 'active',
          isActive: true,
          firstName: 'Service',
          lastName: 'Provider',
        },
      });
    }

    console.log('✅ Test data seeded');
  } catch (error: any) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

/**
 * Clean database before each test
 */
export async function cleanE2EDatabase() {
  await cleanInMemoryDatabase();
  const prisma = getE2EPrisma();
  await seedTestData(prisma);
}

/**
 * Close database connection
 */
export async function closeE2EDatabase() {
  await closeInMemoryDatabase();
  isInitialized = false;
}

/**
 * Get Prisma client for E2E tests
 */
export function getE2EPrismaClient(): PrismaClient {
  return getE2EPrisma();
}
