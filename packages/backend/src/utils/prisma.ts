import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma for Supabase connection pooler
// Supabase's pooler doesn't support prepared statements, so we disable them
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // If using Supabase pooler (contains 'pooler.supabase.com'), disable prepared statements
  if (dbUrl.includes('pooler.supabase.com')) {
    // Add pgbouncer=true parameter if not already present
    if (!dbUrl.includes('pgbouncer=true') && !dbUrl.includes('prepared_statements=false')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      return `${dbUrl}${separator}pgbouncer=true`;
    }
  }
  
  return dbUrl;
};

// For E2E tests, read DATABASE_URL from file (set by TestContainers in global-setup)
// Check if we're in E2E test mode by looking for the database URL file
// The file is written to the project root, so we need to find it from there
let e2eDatabaseUrl: string | null = null;
try {
  const fs = require('fs');
  const path = require('path');
  
  // Try multiple paths to find the .e2e-database-url file
  // The file is written to the project root during global-setup
  const possiblePaths = [
    // 1. From current working directory (project root when running from root, or packages/backend when running from there)
    path.join(process.cwd(), '.e2e-database-url'),
    // 2. Go up one level from cwd (if running from packages/backend)
    path.join(process.cwd(), '..', '.e2e-database-url'),
    // 3. From source file location (when running from source)
    path.resolve(__dirname, '../../../../../.e2e-database-url'),
    // 4. From compiled dist location
    path.resolve(__dirname, '../../../../../../.e2e-database-url'),
  ];
  
  // Check which file exists
  const dbUrlFile = possiblePaths.find(f => {
    try {
      return fs.existsSync(f);
    } catch {
      return false;
    }
  });
  
  if (dbUrlFile) {
    const dbUrl = fs.readFileSync(dbUrlFile, 'utf8').trim();
    e2eDatabaseUrl = dbUrl;
    // Always set it, even if DATABASE_URL already exists (E2E tests should override)
    process.env.DATABASE_URL = dbUrl;
    console.log('[WebServer] ✅ Read DATABASE_URL from TestContainers file:', dbUrlFile);
    console.log('[WebServer] ✅ DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  } else if (!process.env.DATABASE_URL) {
    console.log('[WebServer] ⚠️  DATABASE_URL not set and .e2e-database-url file not found');
    console.log('[WebServer] ⚠️  Checked paths:', possiblePaths);
  }
} catch (error: any) {
  // Log error but don't fail - might not be in E2E test mode
  if (error?.message) {
    console.log('[WebServer] ⚠️  Error reading .e2e-database-url:', error.message);
  }
}

// Override DATABASE_URL environment variable before creating PrismaClient
// This ensures the computed database URL is used by Prisma
const computedDatabaseUrl = getDatabaseUrl();
if (computedDatabaseUrl && computedDatabaseUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = computedDatabaseUrl;
}

// Get the final DATABASE_URL to use
const finalDatabaseUrl = process.env.DATABASE_URL || '';

// For E2E tests, always create a new PrismaClient instance (don't reuse global)
// This ensures it uses the correct DATABASE_URL from the file
const shouldUseE2EDatabase = !!e2eDatabaseUrl;

// If we have an existing global Prisma client but we're switching to E2E mode,
// disconnect it first to avoid connection issues
if (shouldUseE2EDatabase && globalForPrisma.prisma) {
  globalForPrisma.prisma.$disconnect().catch(() => {
    // Ignore disconnect errors
  });
  globalForPrisma.prisma = undefined;
}

// Create Prisma client - for E2E tests, DATABASE_URL is set from TestContainers
// Pass DATABASE_URL explicitly to ensure it uses the correct database
// For integration tests, we need to ensure the client uses the DATABASE_URL
// that's set by test setup. Since the client is created at import time,
// we'll create it lazily for integration tests.
const isIntegrationTest = process.env.NODE_ENV === 'test' && !shouldUseE2EDatabase;

let prismaInstance: PrismaClient | null = null;
let prismaInstanceUrl: string | null = null;

function createPrismaClient(): PrismaClient {
  const currentDbUrl = process.env.DATABASE_URL || finalDatabaseUrl || '';
  
  // For integration tests, always use current DATABASE_URL
  // If URL changed, disconnect old client and create new one
  if (isIntegrationTest) {
    if (prismaInstance && prismaInstanceUrl !== currentDbUrl && currentDbUrl) {
      prismaInstance.$disconnect().catch(() => {});
      prismaInstance = null;
      prismaInstanceUrl = null;
    }
    
    if (!prismaInstance && currentDbUrl) {
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: currentDbUrl,
          },
        },
        log: ['error'],
      });
      prismaInstanceUrl = currentDbUrl;
      return prismaInstance;
    }
  }
  
  // For non-test or E2E tests, use singleton pattern
  if (!prismaInstance) {
    prismaInstance = (shouldUseE2EDatabase ? null : globalForPrisma.prisma) ??
      new PrismaClient({
        datasources: finalDatabaseUrl ? {
          db: {
            url: finalDatabaseUrl,
          },
        } : undefined,
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
      });
    
    if (process.env.NODE_ENV !== 'production' && !shouldUseE2EDatabase) {
      globalForPrisma.prisma = prismaInstance;
    }
    prismaInstanceUrl = finalDatabaseUrl;
  }
  
  return prismaInstance;
}

// For integration tests, use a Proxy to lazy-load the client
// This ensures it uses the DATABASE_URL set by test setup
export const prisma = isIntegrationTest
  ? new Proxy({} as PrismaClient, {
      get(_target, prop) {
        const client = createPrismaClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
          return value.bind(client);
        }
        return value;
      },
      set(_target, prop, value) {
        const client = createPrismaClient();
        (client as any)[prop] = value;
        return true;
      }
    })
  : createPrismaClient();

// Test database connection on startup (non-blocking)
// Skip connection test if DATABASE_URL points to TestContainers (E2E/integration tests)
const isTestContainers = process.env.DATABASE_URL?.includes('localhost') && 
                         process.env.DATABASE_URL?.includes('testdb');

if (process.env.NODE_ENV !== 'production' && !isTestContainers && !isIntegrationTest) {
  // For integration tests, don't test connection at module load time
  // The connection will be tested when the client is first used
  const client = isIntegrationTest ? null : prisma;
  if (client) {
    client.$connect()
      .then(() => {
        logger.info('✅ Database connection successful');
      })
      .catch((error: any) => {
        const dbUrl = process.env.DATABASE_URL || '';
        logger.error('❌ Database connection failed:', error.message);
        
        if (error.message?.includes('localhost:5432') || error.message?.includes('127.0.0.1:5432')) {
          logger.error('❌ Cannot reach database at localhost:5432');
          logger.error('❌ Please ensure PostgreSQL is running locally, or set DATABASE_URL to a remote database');
        } else if (!dbUrl) {
          logger.error('❌ DATABASE_URL is not set');
          logger.error('❌ Please set DATABASE_URL environment variable');
        } else {
          logger.error(`❌ Check your DATABASE_URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
        }
        // Don't throw - let the server start, but API calls will fail with clearer errors
      });
  }
}

// Graceful shutdown handler
// IMPORTANT: For integration tests, we completely skip this handler
// The test setup (closeTestDatabase) will handle disconnection explicitly
// This prevents infinite loops from multiple event handlers in test workers
const globalForShutdown = globalThis as unknown as {
  prismaShutdownHandlerRegistered?: boolean;
  prismaIsDisconnecting?: boolean;
  prismaShutdownHandler?: () => Promise<void>;
};

// Only register handler if NOT in test environment
// For test environment, the handler should never be registered
const shouldRegisterHandler = process.env.NODE_ENV !== 'test' && !shouldUseE2EDatabase;

if (shouldRegisterHandler && !globalForShutdown.prismaShutdownHandlerRegistered) {
  globalForShutdown.prismaShutdownHandlerRegistered = true;
  
  const shutdownHandler = async () => {
    // Double-check at runtime - if we're in test mode now, skip
    if (process.env.NODE_ENV === 'test' || shouldUseE2EDatabase) {
      return;
    }
    
    // Prevent multiple disconnection attempts
    if (globalForShutdown.prismaIsDisconnecting) {
      return;
    }
    globalForShutdown.prismaIsDisconnecting = true;
    
      try {
        // Get the actual client instance (not the Proxy)
        const client = prismaInstance || globalForPrisma.prisma;
        if (client && typeof client.$disconnect === 'function') {
          await client.$disconnect();
          // Only log if not in test mode (prevents log loops)
          if (process.env.NODE_ENV !== 'test') {
            logger.info('Prisma client disconnected');
          }
        }
      } catch (error) {
        // Ignore disconnection errors during shutdown
      }
    // Don't reset the flag - once we've disconnected, we're done
    // This prevents the handler from running again if beforeExit fires multiple times
  };
  
  globalForShutdown.prismaShutdownHandler = shutdownHandler;
  process.on('beforeExit', shutdownHandler);
} else if (!shouldRegisterHandler) {
  // For test environment, mark as registered to prevent new handlers
  // This ensures that even if the module is imported before NODE_ENV is set,
  // we won't register a handler
  globalForShutdown.prismaShutdownHandlerRegistered = true;
}













