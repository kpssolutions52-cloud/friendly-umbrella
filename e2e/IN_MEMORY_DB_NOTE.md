# In-Memory Database Implementation Note

## Current Status

The in-memory database setup using `pg-mem` has been created, but there's a technical challenge:

**Issue**: Prisma doesn't directly support in-memory databases like `pg-mem` because:
- Prisma uses connection pooling
- Prisma expects a real PostgreSQL connection
- pg-mem provides an in-memory implementation but needs special integration

## Current Implementation

The setup files are in place:
- ✅ `packages/backend/src/__tests__/e2e/db-setup.ts` - Database setup
- ✅ `e2e/helpers/db-helper.ts` - Test helpers
- ✅ `e2e/helpers/global-setup.ts` - Playwright setup
- ✅ Test case generation working

## Alternative Solutions

### Option 1: Use Test Database (Recommended for Now)

For E2E tests, you can use a separate test database:

1. **Create test database**:
   ```sql
   CREATE DATABASE construction_pricing_e2e_test;
   ```

2. **Set environment variable**:
   ```bash
   export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/construction_pricing_e2e_test?schema=public
   ```

3. **Run migrations**:
   ```bash
   DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
   ```

4. **Run tests** (without USE_IN_MEMORY_DB):
   ```bash
   playwright test
   ```

### Option 2: Use Docker PostgreSQL for Tests

Use a temporary PostgreSQL container for E2E tests:

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    ports:
      - "5433:5432"
```

### Option 3: Continue with pg-mem (Advanced)

To make pg-mem work with Prisma, you would need to:
1. Create a custom Prisma engine adapter
2. Intercept all Prisma queries
3. Translate them to pg-mem calls

This is complex and may not be worth the effort.

## Recommendation

For now, **use Option 1** (test database) for E2E tests. It's:
- ✅ Simple and reliable
- ✅ Works with all Prisma features
- ✅ Fast enough for E2E tests
- ✅ Easy to clean between test runs

The in-memory database infrastructure is ready if you want to pursue Option 3 later.

## Running Tests with Test Database

1. Create test database
2. Set `TEST_DATABASE_URL` environment variable
3. Run: `playwright test` (without `USE_IN_MEMORY_DB`)

The test database will be cleaned between runs using the existing cleanup functions.







