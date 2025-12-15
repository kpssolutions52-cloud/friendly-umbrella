import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

let postgresContainer: PostgreSqlContainer | null = null;
let e2ePrisma: PrismaClient | null = null;
let isInitialized = false;
let databaseUrl: string | null = null;

// File to store DATABASE_URL for backend process
const DB_URL_FILE = path.join(__dirname, '../../../../.e2e-database-url');

/**
 * Execute SQL script file
 */
async function executeSqlScript(prisma: PrismaClient, scriptPath: string): Promise<void> {
  // Check if file exists first
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script file not found: ${scriptPath}`);
  }
  
  const sql = fs.readFileSync(scriptPath, 'utf8');
  
  // Split by semicolons and execute each statement
  // But be careful with DO blocks - they contain semicolons
  const statements = sql
    .split(/;(?![^$]*\$\$)/) // Split on semicolons not inside DO $$ blocks
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  // For simplicity, execute the entire SQL as one statement
  // PostgreSQL can handle multiple statements
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (error: any) {
    // Some errors are expected (like "already exists")
    if (error.message?.includes('already exists') || 
        error.message?.includes('duplicate') ||
        error.message?.includes('does not exist')) {
      // Ignore - object already exists or doesn't exist (for IF NOT EXISTS)
      return;
    }
    console.warn(`⚠️  Warning executing ${path.basename(scriptPath)}:`, error.message);
    // Don't throw - continue with other scripts
  }
}

/**
 * Create database schema from SQL scripts
 */
async function createSchemaFromSqlScripts(prisma: PrismaClient): Promise<void> {
  // Calculate path to database folder from the compiled location
  // __dirname will be packages/backend/dist/__tests__/e2e or packages/backend/src/__tests__/e2e
  // We need to go up to the monorepo root, then into database/
  // Try from process.cwd() first (monorepo root) - most reliable
  let databaseDir = path.resolve(process.cwd(), 'database');
  
  // If that doesn't exist, try relative to __dirname
  if (!fs.existsSync(databaseDir)) {
    databaseDir = path.resolve(__dirname, '../../../../../database');
  }
  if (!fs.existsSync(databaseDir)) {
    databaseDir = path.resolve(__dirname, '../../../../database');
  }
  
  console.log(`📂 Looking for SQL scripts in: ${databaseDir}`);
  console.log(`📂 __dirname: ${__dirname}`);
  console.log(`📂 process.cwd(): ${process.cwd()}`);
  
  if (!fs.existsSync(databaseDir)) {
    throw new Error(`Database directory not found. Tried: ${databaseDir}`);
  }
  
  // Verify we can see at least one script file
  const testScript = path.join(databaseDir, '01-create-enums.sql');
  if (!fs.existsSync(testScript)) {
    console.error(`❌ Test script not found: ${testScript}`);
    const files = fs.readdirSync(databaseDir);
    console.error(`   Files in directory: ${files.slice(0, 5).join(', ')}...`);
    throw new Error(`Cannot find SQL scripts in ${databaseDir}`);
  }
  
  // Define the order of SQL scripts to execute
  const scriptOrder = [
    '01-create-enums.sql',
    '12-add-customer-role.sql', // Add customer to UserRole enum
    '16-add-products-services.sql', // Add ProductType enum, service_provider, service provider roles
    '02-create-tenants.sql',
    '09-add-tenant-logo-url.sql', // Add logo_url to tenants
    '03-create-users.sql',
    '15-add-category-id-to-products.sql', // Creates product_categories and adds category_id
    '04-create-products.sql',
    '10-create-product-images.sql',
    '18-add-service-pricing-fields.sql', // Add rate_per_hour and rate_type
    '05-create-default-prices.sql',
    '06-create-private-prices.sql',
    '07-create-price-audit-log.sql',
    '08-create-price-views.sql',
  ];
  
  console.log('📋 Executing SQL scripts to create database schema...');
  
  for (const scriptName of scriptOrder) {
    const scriptPath = path.join(databaseDir, scriptName);
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Script not found: ${scriptPath}`);
      console.error(`   Database dir: ${databaseDir}`);
      throw new Error(`Required SQL script not found: ${scriptName} at ${scriptPath}`);
    }
    
    try {
      console.log(`  📄 Executing ${scriptName}...`);
      await executeSqlScript(prisma, scriptPath);
      console.log(`  ✅ ${scriptName} completed`);
    } catch (error: any) {
      console.error(`  ❌ Error executing ${scriptName}:`, error.message);
      // Continue with other scripts - some errors are expected
    }
  }
  
  console.log('✅ Database schema created from SQL scripts');
}

/**
 * Initialize PostgreSQL database using TestContainers for E2E tests
 * This creates a real PostgreSQL container that Prisma can connect to
 */
export async function setupInMemoryDatabase(): Promise<PrismaClient> {
  if (isInitialized && e2ePrisma) {
    return e2ePrisma;
  }

  console.log('🔧 Setting up PostgreSQL database with TestContainers for E2E tests...');

  try {
    // Start PostgreSQL container
    postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    // Get connection string from container
    databaseUrl = postgresContainer.getConnectionUri();
    
    console.log('✅ PostgreSQL container started');
    console.log(`📦 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

    // Set DATABASE_URL environment variable for Prisma (in this process)
    process.env.DATABASE_URL = databaseUrl;
    
    // Write DATABASE_URL to file so backend process can read it
    fs.writeFileSync(DB_URL_FILE, databaseUrl, 'utf8');
    console.log('✅ Database URL written to file for backend process');

    // Create Prisma client (assumes it's already generated)
    // We don't need to generate it here - it should be generated during build
    e2ePrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Test connection
    await e2ePrisma.$connect();
    console.log('✅ Prisma client connected to PostgreSQL container');

    // Create schema from SQL scripts
    await createSchemaFromSqlScripts(e2ePrisma);

    // Mark as initialized
    isInitialized = true;
    console.log('✅ TestContainers database setup complete');

    return e2ePrisma;
  } catch (error: any) {
    console.error('❌ Failed to setup TestContainers database:', error.message);
    // Clean up on error
    if (postgresContainer) {
      try {
        await postgresContainer.stop();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

/**
 * Get E2E Prisma client
 */
export function getE2EPrisma(): PrismaClient {
  if (!e2ePrisma) {
    throw new Error('TestContainers database not initialized. Call setupInMemoryDatabase() first.');
  }
  return e2ePrisma;
}

/**
 * Get database connection URL
 */
export function getDatabaseUrl(): string {
  if (!databaseUrl) {
    throw new Error('Database URL not available. Call setupInMemoryDatabase() first.');
  }
  return databaseUrl;
}

/**
 * Clean database (truncate all tables)
 */
export async function cleanInMemoryDatabase() {
  if (!e2ePrisma) {
    return;
  }

  try {
    // Delete all data from tables in correct order (respecting foreign keys)
    await e2ePrisma.priceView.deleteMany().catch(() => {});
    await e2ePrisma.priceAuditLog.deleteMany().catch(() => {});
    await e2ePrisma.privatePrice.deleteMany().catch(() => {});
    await e2ePrisma.defaultPrice.deleteMany().catch(() => {});
    await e2ePrisma.productImage.deleteMany().catch(() => {});
    await e2ePrisma.product.deleteMany().catch(() => {});
    await e2ePrisma.serviceCategory.deleteMany().catch(() => {});
    await e2ePrisma.productCategory.deleteMany().catch(() => {});
    await e2ePrisma.user.deleteMany().catch(() => {});
    await e2ePrisma.tenant.deleteMany().catch(() => {});
    
    console.log('✅ Database cleaned');
  } catch (error) {
    console.warn('⚠️  Error cleaning database:', error);
  }
}

/**
 * Close database connection and stop container
 */
export async function closeInMemoryDatabase() {
  if (e2ePrisma) {
    try {
      await e2ePrisma.$disconnect();
      console.log('✅ Prisma client disconnected');
    } catch (error) {
      // Ignore disconnect errors
    }
    e2ePrisma = null;
  }
  
  if (postgresContainer) {
    try {
      await postgresContainer.stop();
      console.log('✅ PostgreSQL container stopped');
    } catch (error) {
      console.warn('⚠️  Error stopping container:', error);
    }
    postgresContainer = null;
  }
  
  databaseUrl = null;
  isInitialized = false;
  
  // Clean up DATABASE_URL file
  try {
    if (fs.existsSync(DB_URL_FILE)) {
      fs.unlinkSync(DB_URL_FILE);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}
