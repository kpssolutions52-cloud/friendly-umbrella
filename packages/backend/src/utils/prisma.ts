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
export const prisma =
  (shouldUseE2EDatabase ? null : globalForPrisma.prisma) ??
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

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test database connection on startup (non-blocking)
// Skip connection test if DATABASE_URL points to TestContainers (E2E tests)
const isTestContainers = process.env.DATABASE_URL?.includes('localhost') && 
                         process.env.DATABASE_URL?.includes('testdb');

if (process.env.NODE_ENV !== 'production' && !isTestContainers) {
  prisma.$connect()
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

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Prisma client disconnected');
});













