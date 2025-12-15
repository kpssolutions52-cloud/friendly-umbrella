import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

let postgresContainer: StartedPostgreSqlContainer | null = null;
let e2ePrisma: PrismaClient | null = null;
let isInitialized = false;
let databaseUrl: string | null = null;

// File to store DATABASE_URL for backend process
const DB_URL_FILE = path.join(__dirname, '../../../../../.e2e-database-url');

/**
 * Execute Prisma command (generate, db push, etc.)
 */
async function executePrismaCommand(command: string, args: string[], cwd: string, env: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    // Try to use Prisma from the backend package's node_modules first
    const prismaPath = path.join(cwd, 'node_modules', '.bin', 'prisma');
    const prismaCmd = fs.existsSync(prismaPath) 
      ? (process.platform === 'win32' ? `${prismaPath}.cmd` : prismaPath)
      : 'npx';
    
    const prismaArgs = fs.existsSync(prismaPath)
      ? [command, ...args]
      : ['prisma', command, ...args];
    
    const proc = spawn(prismaCmd, prismaArgs, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
      shell: true, // Use shell for Windows compatibility
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Check if it's a permission error that we can ignore
        const errorMsg = stderr || stdout;
        if (errorMsg.includes('EPERM') && errorMsg.includes('query_engine')) {
          // Permission error on Windows - might be OneDrive locking the file
          // Try to continue anyway as the client might still be usable
          console.warn('⚠️  Prisma generate had a permission warning, but continuing...');
          resolve();
        } else {
          reject(new Error(`Prisma ${command} failed with code ${code}: ${errorMsg}`));
        }
      }
    });
  });
}

/**
 * Create database schema using Prisma db push
 */
async function createSchemaFromPrisma(databaseUrl: string): Promise<void> {
  // Try multiple methods to find the backend directory
  // Method 1: From __dirname (when running from compiled code)
  let backendDir = path.resolve(__dirname, '../../..');
  
  // Method 2: From process.cwd() (when running from project root)
  const projectRoot = process.cwd();
  const backendDirFromRoot = path.join(projectRoot, 'packages', 'backend');
  
  // Check which one has the prisma directory
  const schemaPath1 = path.join(backendDir, 'prisma', 'schema.prisma');
  const schemaPath2 = path.join(backendDirFromRoot, 'prisma', 'schema.prisma');
  
  let schemaPath: string;
  let prismaDir: string;
  
  if (fs.existsSync(schemaPath1)) {
    schemaPath = schemaPath1;
    prismaDir = path.join(backendDir, 'prisma');
    backendDir = backendDir;
  } else if (fs.existsSync(schemaPath2)) {
    schemaPath = schemaPath2;
    prismaDir = path.join(backendDirFromRoot, 'prisma');
    backendDir = backendDirFromRoot;
  } else {
    // Try to find it by searching from project root
    const possiblePaths = [
      path.join(projectRoot, 'packages', 'backend', 'prisma', 'schema.prisma'),
      path.join(projectRoot, 'backend', 'prisma', 'schema.prisma'),
      path.resolve(__dirname, '../../../prisma/schema.prisma'),
      path.resolve(__dirname, '../../../../packages/backend/prisma/schema.prisma'),
    ];
    
    schemaPath = possiblePaths.find(p => fs.existsSync(p)) || schemaPath1;
    prismaDir = path.dirname(schemaPath);
    backendDir = path.dirname(prismaDir);
  }
  
  console.log('📋 Creating database schema from Prisma schema...');
  console.log(`📂 Backend directory: ${backendDir}`);
  console.log(`📂 Prisma directory: ${prismaDir}`);
  console.log(`📄 Schema path: ${schemaPath}`);
  
  // Verify schema file exists
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema file not found at: ${schemaPath}. Checked: ${schemaPath1}, ${schemaPath2}`);
  }
  
  try {
    // First, generate Prisma client
    // On Windows with OneDrive, this might have permission warnings but will continue
    console.log('  🔧 Generating Prisma client...');
    await executePrismaCommand('generate', ['--schema', schemaPath], backendDir, { DATABASE_URL: databaseUrl });
    console.log('  ✅ Prisma client generated');
    
    // Then, push schema to database
    console.log('  🔧 Pushing Prisma schema to database...');
    await executePrismaCommand('db', ['push', '--accept-data-loss', '--skip-generate', '--schema', schemaPath], backendDir, { DATABASE_URL: databaseUrl });
    console.log('  ✅ Database schema created from Prisma schema');
  } catch (error: any) {
    console.error('❌ Failed to create database schema:', error.message);
    throw error;
  }
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
    const container = new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass');
    
    postgresContainer = await container.start();

    // Get connection string from container
    if (!postgresContainer) {
      throw new Error('PostgreSQL container failed to start');
    }
    // Get connection URI from started container
    // In TestContainers v11, the started container has getConnectionUri() method
    try {
      databaseUrl = postgresContainer.getConnectionUri();
    } catch (error) {
      // Fallback: build connection string from container properties
      const host = postgresContainer.getHost();
      const port = postgresContainer.getPort();
      databaseUrl = `postgresql://testuser:testpass@${host}:${port}/testdb`;
    }
    
    if (!databaseUrl) {
      throw new Error('Failed to get database connection URI from container');
    }
    
    console.log('✅ PostgreSQL container started');
    console.log(`📦 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

    // Set DATABASE_URL environment variable for Prisma (in this process)
    process.env.DATABASE_URL = databaseUrl;
    
    // Write DATABASE_URL to file so backend process can read it
    fs.writeFileSync(DB_URL_FILE, databaseUrl, 'utf8');
    console.log('✅ Database URL written to file for backend process');

    // Create Prisma client (assumes it's already generated)
    // We don't need to generate it here - it should be generated during build
    if (!databaseUrl) {
      throw new Error('Database URL is not available');
    }
    e2ePrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Create schema from Prisma schema (not SQL scripts)
    if (!databaseUrl) {
      throw new Error('Database URL is not available');
    }
    await createSchemaFromPrisma(databaseUrl);

    // Create Prisma client after schema is created
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

    // Verify that tables were created
    const tables = await e2ePrisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `;
    console.log(`📊 Created ${tables.length} tables: ${tables.map(t => t.tablename).join(', ')}`);
    
    if (tables.length === 0) {
      throw new Error('No tables were created. Prisma db push may have failed.');
    }

    // Mark as initialized
    isInitialized = true;
    console.log('✅ TestContainers database setup complete');

    return e2ePrisma;
  } catch (error: any) {
    console.error('❌ Failed to setup TestContainers database:', error.message);
    
    // Check if it's a Docker-related error
    if (error.message?.includes('container runtime') || 
        error.message?.includes('Docker') ||
        error.message?.includes('docker_engine')) {
      console.error('');
      console.error('🐳 Docker is required for E2E tests with TestContainers');
      console.error('📋 Please ensure Docker Desktop is installed and running:');
      console.error('   1. Open Docker Desktop application');
      console.error('   2. Wait until Docker Desktop shows "Docker Desktop is running"');
      console.error('   3. Verify with: docker ps');
      console.error('   4. Then run the E2E tests again');
      console.error('');
      console.error('💡 On Windows: Docker Desktop must be running for TestContainers to work');
      console.error('');
    }
    
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
      // Stop the container - StartedPostgreSqlContainer has stop() method
      await (postgresContainer as any).stop();
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



