import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { execSync, spawn } from 'child_process';
import { join, resolve, dirname } from 'path';
import * as fs from 'fs';

let postgresContainer: StartedPostgreSqlContainer | null = null;
let prisma: PrismaClient | null = null;
let isDatabaseInitialized = false;
let databaseUrl: string | null = null;
let setupPromise: Promise<void> | null = null; // Mutex to prevent concurrent setup
let isSetupInProgress = false; // Synchronous flag to prevent race conditions

/**
 * Execute Prisma command (generate, db push, etc.)
 */
async function executePrismaCommand(command: string, args: string[], cwd: string, env: Record<string, string>): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:15',message:'executePrismaCommand entry',data:{command,args:args.join(' '),cwd},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Build the command array for execSync
    const prismaArgs = [command, ...args];
    const fullCommand = `npx prisma ${prismaArgs.join(' ')}`;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:20',message:'About to spawn Prisma command',data:{fullCommand},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Use spawn with captured output to detect EPERM errors
    // We need to capture stderr to see Prisma's EPERM messages
    const [cmd, ...cmdArgs] = fullCommand.split(' ');
    
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
      const proc = spawn(cmd, cmdArgs, {
        cwd,
        env: { ...process.env, ...env },
        shell: true,
      });
      
      proc.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:36',message:'stdout data received',data:{outputLength:output.length,hasEPERM:output.includes('EPERM')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        if (!process.env.CI) {
          process.stdout.write(output);
        }
      });
      
      proc.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:44',message:'stderr data received',data:{outputLength:output.length,hasEPERM:output.includes('EPERM'),outputPreview:output.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        if (!process.env.CI) {
          process.stderr.write(output);
        }
      });
      
      proc.on('close', (code: number) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:51',message:'Process closed',data:{code,stdoutLength:stdout.length,stderrLength:stderr.length,stdoutHasEPERM:stdout.includes('EPERM'),stderrHasEPERM:stderr.includes('EPERM'),command},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        if (code === 0) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:54',message:'Process succeeded',data:{command},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          resolve();
        } else {
          // Check if it's an EPERM error
          const allOutput = `${stdout} ${stderr}`;
          const isEpermError = 
            allOutput.includes('EPERM') ||
            allOutput.includes('operation not permitted');
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:62',message:'Process failed, checking EPERM',data:{code,isEpermError,command,allOutputLength:allOutput.length,allOutputPreview:allOutput.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          
          if (isEpermError && command === 'generate') {
            // On Windows, this often means the DLL is locked by another process
            // The Prisma client might already be generated, so we can continue
            if (!process.env.CI) {
              console.warn('⚠️  Prisma generate failed with EPERM (file locked). This is common on Windows.');
              console.warn('   The Prisma client may already be generated. Continuing...');
            }
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:68',message:'EPERM detected, resolving',data:{command},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            resolve(); // Continue execution - don't throw
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:70',message:'Non-EPERM error, rejecting',data:{code,command,stderrPreview:stderr.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            reject(new Error(`Command failed with code ${code}: ${stderr || stdout || 'Unknown error'}`));
          }
        }
      });
      
      proc.on('error', (error: Error) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:75',message:'Process error event',data:{errorMessage:error.message,command},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        reject(error);
      });
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:79',message:'Catch block error',data:{errorMessage:error?.message,command,hasEPERM:error?.message?.includes('EPERM')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    // Fallback error handling
    const errorMessage = String(error?.message || '');
    if (errorMessage.includes('EPERM') && command === 'generate') {
      if (!process.env.CI) {
        console.warn('⚠️  Prisma generate failed with EPERM (file locked). Continuing...');
      }
      return; // Continue execution
    }
    throw error;
  }
}

/**
 * Create database schema using Prisma db push
 */
async function createSchemaFromPrisma(databaseUrl: string): Promise<void> {
  // Find the backend directory
  let backendDir = resolve(__dirname, '../../..');
  const projectRoot = process.cwd();
  const backendDirFromRoot = join(projectRoot, 'packages', 'backend');
  
  const schemaPath1 = join(backendDir, 'prisma', 'schema.prisma');
  const schemaPath2 = join(backendDirFromRoot, 'prisma', 'schema.prisma');
  
  let schemaPath: string;
  let prismaDir: string;
  
  if (fs.existsSync(schemaPath1)) {
    schemaPath = schemaPath1;
    prismaDir = join(backendDir, 'prisma');
    backendDir = backendDir;
  } else if (fs.existsSync(schemaPath2)) {
    schemaPath = schemaPath2;
    prismaDir = join(backendDirFromRoot, 'prisma');
    backendDir = backendDirFromRoot;
  } else {
    // Try to find it by searching from project root
    const possiblePaths = [
      join(projectRoot, 'packages', 'backend', 'prisma', 'schema.prisma'),
      join(projectRoot, 'backend', 'prisma', 'schema.prisma'),
      resolve(__dirname, '../../../prisma/schema.prisma'),
      resolve(__dirname, '../../../../packages/backend/prisma/schema.prisma'),
    ];
    
    schemaPath = possiblePaths.find(p => fs.existsSync(p)) || schemaPath1;
    prismaDir = dirname(schemaPath);
    backendDir = dirname(prismaDir);
  }
  
  if (!process.env.CI) {
    console.log('📋 Creating database schema from Prisma schema...');
    console.log(`📂 Backend directory: ${backendDir}`);
    console.log(`📄 Schema path: ${schemaPath}`);
  }
  
  // Verify schema file exists
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema file not found at: ${schemaPath}`);
  }
  
  try {
    // First, generate Prisma client (skip if EPERM error - client might already be generated)
    if (!process.env.CI) {
      console.log('  🔧 Generating Prisma client...');
    }
    // executePrismaCommand handles EPERM errors internally for generate command
    await executePrismaCommand('generate', ['--schema', schemaPath], backendDir, { DATABASE_URL: databaseUrl });
    if (!process.env.CI) {
      console.log('  ✅ Prisma client generated (or already exists)');
    }
    
    // Then, push schema to database
    if (!process.env.CI) {
      console.log('  🔧 Pushing Prisma schema to database...');
    }
    await executePrismaCommand('db', ['push', '--accept-data-loss', '--skip-generate', '--schema', schemaPath], backendDir, { DATABASE_URL: databaseUrl });
    if (!process.env.CI) {
      console.log('  ✅ Database schema created from Prisma schema');
    }
  } catch (error: any) {
    // Check if it's an EPERM error that we should ignore
    const errorMessage = String(error?.message || '');
    if (errorMessage.includes('EPERM') || errorMessage.includes('operation not permitted')) {
      if (!process.env.CI) {
        console.warn('⚠️  Prisma command had EPERM error (file locked), but continuing...');
      }
      // For EPERM errors, we'll try to continue - the client might already be generated
      // and the schema might already be pushed
      return;
    }
    console.error('❌ Failed to create database schema:', error.message);
    throw error;
  }
}

/**
 * Initialize test database using TestContainers
 * This automatically starts a PostgreSQL container for integration tests
 */
export async function setupTestDatabase() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:215',message:'setupTestDatabase called',data:{isDatabaseInitialized,hasPrisma:!!prisma,hasSetupPromise:!!setupPromise,isSetupInProgress,stackTrace:new Error().stack?.split('\n').slice(1,4).join('|')},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // If already initialized, return immediately
  if (isDatabaseInitialized && prisma) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:221',message:'setupTestDatabase early return - already initialized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return;
  }
  
  // Use a spin-lock pattern: check, set, and verify we were the one who set it
  // This ensures only one call creates the promise even under concurrent access
  let retryCount = 0;
  const maxRetries = 100; // Prevent infinite loops
  
  while (retryCount < maxRetries) {
    // Check if setup is already in progress or completed
    if (isDatabaseInitialized && prisma) {
      return; // Already initialized
    }
    
    if (setupPromise) {
      // Setup is in progress, wait for it
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:232',message:'setupTestDatabase waiting for existing promise',data:{retryCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      await setupPromise;
      // After waiting, check again if we're initialized
      if (isDatabaseInitialized && prisma) {
        return;
      }
      // If still not initialized after waiting, something went wrong - retry
      retryCount++;
      continue;
    }
    
    // Try to claim the lock by setting the flag
    // This check-and-set must be as atomic as possible
    if (!isSetupInProgress && !setupPromise) {
      // Atomically claim the lock
      isSetupInProgress = true;
      
      // Immediate double-check: did another call beat us?
      if (!setupPromise) {
        // We successfully claimed the lock - create the promise IMMEDIATELY
        // Don't await anything before creating the promise
        const newPromise = (async () => {
          try {
            await performSetup();
          } finally {
            // Clear both flags when done
            isSetupInProgress = false;
            setupPromise = null;
          }
        })();
        
        // Assign the promise BEFORE any await
        setupPromise = newPromise;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:275',message:'setupTestDatabase created new setup promise',data:{retryCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run6',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Now wait for the setup to complete
        await setupPromise;
        
        // Final check after waiting
        if (isDatabaseInitialized && prisma) {
          return;
        }
        // If still not initialized, something went wrong - retry
        retryCount++;
        continue;
      } else {
        // Another call created the promise while we were setting the flag
        // Release our claim and wait for their promise
        isSetupInProgress = false;
        await setupPromise;
        if (isDatabaseInitialized && prisma) {
          return;
        }
        retryCount++;
        continue;
      }
    } else {
      // Another call is setting up or has a promise, wait briefly and retry
      await new Promise(resolve => setTimeout(resolve, 10));
      retryCount++;
      continue;
    }
  }
  
  throw new Error('setupTestDatabase: Max retries exceeded, possible deadlock');
}

async function performSetup() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:249',message:'performSetup starting',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Double-check after acquiring mutex
  if (isDatabaseInitialized && prisma) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ffc4162d-fb85-423d-9e8c-077a8c229493',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'testSetup.ts:254',message:'performSetup early return - already initialized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return;
  }

  if (!process.env.CI) {
    console.log('🔧 Setting up PostgreSQL database with TestContainers for integration tests...');
  }

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
    
    if (!process.env.CI) {
      console.log('✅ PostgreSQL container started');
      console.log(`📦 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
    }

    // Set DATABASE_URL environment variable for Prisma
    // CRITICAL: Set this BEFORE creating schema, so Prisma commands use the correct DB
    // This is also critical for the app's Prisma client (used by auth middleware)
    // The Prisma client in utils/prisma.ts now uses lazy loading for integration tests,
    // so it will use this DATABASE_URL when it's first accessed
    process.env.DATABASE_URL = databaseUrl;
    process.env.TEST_DATABASE_URL = databaseUrl;

    // Create schema from Prisma schema
    await createSchemaFromPrisma(databaseUrl);

    // Create Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Test connection
    await prisma.$connect();
    if (!process.env.CI) {
      console.log('✅ Prisma client connected to PostgreSQL container');
    }

    // Verify that tables were created
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `;
    
    if (!process.env.CI) {
      console.log(`📊 Created ${tables.length} tables: ${tables.map(t => t.tablename).join(', ')}`);
    }
    
    if (tables.length === 0) {
      throw new Error('No tables were created. Prisma db push may have failed.');
    }

    // Mark as initialized
    isDatabaseInitialized = true;
    if (!process.env.CI) {
      console.log('✅ TestContainers database setup complete');
    }
  } catch (error: any) {
    console.error('❌ Failed to setup TestContainers database:', error.message);
    
    // Check if it's a Docker-related error
    if (error.message?.includes('container runtime') || 
        error.message?.includes('Docker') ||
        error.message?.includes('docker_engine')) {
      console.error('');
      console.error('🐳 Docker is required for integration tests with TestContainers');
      console.error('📋 Please ensure Docker Desktop is installed and running:');
      console.error('   1. Open Docker Desktop application');
      console.error('   2. Wait until Docker Desktop shows "Docker Desktop is running"');
      console.error('   3. Verify with: docker ps');
      console.error('   4. Then run the integration tests again');
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
 * Helper to safely delete from a table, ignoring missing table errors
 */
async function safeDeleteMany(prisma: PrismaClient, model: any, tableName: string): Promise<void> {
  try {
    await model.deleteMany({});
  } catch (error: any) {
    // Check if it's a Prisma error (case-insensitive matching)
    const errorMessage = String(error?.message || '').toLowerCase();
    const errorCode = String(error?.code || '');
    const errorName = String(error?.name || '');
    
    // Ignore table missing errors - check various patterns
    const isTableMissingError = 
      errorMessage.includes('does not exist') ||
      errorMessage.includes('does not exist in the current database') ||
      errorMessage.includes('relation') ||
      (errorMessage.includes('table') && errorMessage.includes('not exist')) ||
      errorCode === 'P2021' ||  // Table does not exist
      errorCode === '42P01';     // PostgreSQL undefined table
    
    if (isTableMissingError) {
      // Table doesn't exist, skip silently
      return;
    }
    
    // For connection errors, also skip (database might not be available)
    const isConnectionError =
      errorMessage.includes("can't reach database") ||
      errorMessage.includes('cannot reach database') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('connection') ||
      errorCode === 'P1001' ||    // Can't reach database server
      errorCode === 'P1000' ||    // Authentication failed
      errorName === 'PrismaClientInitializationError';
    
    if (isConnectionError) {
      // Database not available, skip cleanup
      return;
    }
    
    // Re-throw other unexpected errors
    throw error;
  }
}

/**
 * Clean test database - truncate all tables
 */
export async function cleanTestDatabase() {
  if (!prisma) {
    return;
  }

  // Delete in correct order to respect foreign key constraints
  // Use safe deletion for all tables to handle missing tables gracefully
  await safeDeleteMany(prisma, prisma.priceView, 'price_views');
  await safeDeleteMany(prisma, prisma.priceAuditLog, 'price_audit_log');
  await safeDeleteMany(prisma, prisma.privatePrice, 'private_prices');
  await safeDeleteMany(prisma, prisma.defaultPrice, 'default_prices');
  await safeDeleteMany(prisma, prisma.productImage, 'product_images');
  await safeDeleteMany(prisma, prisma.product, 'products');
  await safeDeleteMany(prisma, prisma.serviceCategory, 'service_categories');
  await safeDeleteMany(prisma, prisma.productCategory, 'product_categories');
  await safeDeleteMany(prisma, prisma.user, 'users');
  await safeDeleteMany(prisma, prisma.tenant, 'tenants');
}

/**
 * Get test Prisma client
 */
export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    throw new Error('Database not initialized. Call setupTestDatabase() first.');
  }
  return prisma;
}

/**
 * Close database connection and stop TestContainers
 */
export async function closeTestDatabase() {
  // Disconnect test Prisma client
  if (prisma) {
    try {
      await prisma.$disconnect();
      if (!process.env.CI) {
        console.log('✅ Prisma client disconnected');
      }
    } catch (error) {
      // Ignore disconnect errors (connection may already be closed)
    }
    prisma = null;
  }
  
  // Also disconnect the app's Prisma client if it exists
  // This prevents "terminating connection due to administrator command" errors
  try {
    const { prisma: appPrisma } = require('../../utils/prisma');
    if (appPrisma && typeof appPrisma.$disconnect === 'function') {
      await appPrisma.$disconnect().catch(() => {
        // Ignore disconnection errors
      });
    }
  } catch {
    // Module not loaded or Prisma not initialized, that's fine
  }
  
  // Stop PostgreSQL container (this will close all connections)
  if (postgresContainer) {
    try {
      // Stop the container
      await (postgresContainer as any).stop();
      if (!process.env.CI) {
        console.log('✅ PostgreSQL container stopped');
      }
    } catch (error) {
      // Ignore stop errors (container may already be stopped)
      if (!process.env.CI) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (!errorMsg.includes('already been stopped')) {
          console.warn('⚠️  Error stopping container:', errorMsg);
        }
      }
    }
    postgresContainer = null;
  }
  
  databaseUrl = null;
  isDatabaseInitialized = false;
}
