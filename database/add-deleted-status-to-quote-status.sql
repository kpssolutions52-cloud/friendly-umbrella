-- Migration: Add 'deleted' status to QuoteStatus enum
-- Execute this query to add the new 'deleted' status to the QuoteStatus enum type

-- For PostgreSQL 9.5+, you can use IF NOT EXISTS:
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'deleted';

-- For older PostgreSQL versions (if IF NOT EXISTS is not supported), use:
-- ALTER TYPE "QuoteStatus" ADD VALUE 'deleted';

-- Verify the change:
-- SELECT unnest(enum_range(NULL::"QuoteStatus")) AS status;
-- Expected output should include: pending, responded, accepted, rejected, expired, cancelled, deleted

-- Important Notes:
-- 1. This command cannot be run inside a transaction block in older PostgreSQL versions
-- 2. After running this migration, regenerate Prisma client:
--    npx prisma generate
-- 3. Restart your backend server to use the updated enum
