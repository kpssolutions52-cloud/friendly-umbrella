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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Prisma client disconnected');
});













