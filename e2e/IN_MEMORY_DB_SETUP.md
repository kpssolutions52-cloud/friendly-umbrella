# In-Memory Database Setup for E2E Tests

This document explains how the in-memory database is set up for E2E testing.

## Overview

E2E tests use an in-memory PostgreSQL database powered by `pg-mem`. This eliminates the need for:
- External database connections
- Database setup/teardown
- Test data cleanup between runs
- Database migration management

## How It Works

### 1. Global Setup (`e2e/helpers/global-setup.ts`)

When E2E tests start:
1. Sets `USE_IN_MEMORY_DB=true` environment variable
2. Initializes in-memory database using `pg-mem`
3. Creates database schema from Prisma schema
4. Seeds test data (users, tenants, etc.)

### 2. Database Schema Creation

The schema is created programmatically from the Prisma schema, including:
- All tables (tenants, users, products, prices, etc.)
- All enums (TenantType, UserRole, ProductType, etc.)
- All relationships and foreign keys
- All indexes

### 3. Test Data Seeding

Default test users are created:
- **Super Admin**: `admin@system.com` / `admin123`
- **Supplier Admin**: `supplier@example.com` / `password123`
- **Company Admin**: `company@example.com` / `password123`
- **Customer**: `test@example.com` / `password123`
- **Service Provider Admin**: `service@example.com` / `password123`

### 4. Backend Integration

The backend Prisma client automatically uses the in-memory database when `USE_IN_MEMORY_DB=true` is set.

## Running Tests

```bash
# Run all E2E tests with in-memory DB
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

## Test Data

Test data is automatically seeded when the in-memory database is initialized. Each test run starts with a clean database and the same seed data.

### Available Test Users

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Super Admin | admin@system.com | admin123 | None |
| Supplier Admin | supplier@example.com | password123 | Test Supplier |
| Company Admin | company@example.com | password123 | Test Company |
| Customer | test@example.com | password123 | None |
| Service Provider Admin | service@example.com | password123 | Test Service Provider |

## Benefits

1. **No External Dependencies**: No need for PostgreSQL running
2. **Fast**: In-memory operations are very fast
3. **Isolated**: Each test run is completely isolated
4. **Clean**: No leftover data between runs
5. **CI/CD Friendly**: Works in any environment without database setup

## Limitations

1. **Not 100% PostgreSQL Compatible**: Some advanced PostgreSQL features may not work
2. **No Persistence**: Data is lost when tests complete
3. **Single Connection**: Designed for single-threaded test execution

## Troubleshooting

### Database Not Initialized

If you see errors about database not being initialized:
- Check that `USE_IN_MEMORY_DB=true` is set
- Verify global setup is running (check Playwright config)

### Schema Creation Errors

If schema creation fails:
- Check that all Prisma schema types are supported
- Verify enum definitions match Prisma schema

### Test Data Issues

If test users are missing:
- Check `e2e/helpers/db-helper.ts` seed function
- Verify password hashing is working

## Adding New Test Data

To add new test data, edit `e2e/helpers/db-helper.ts` in the `seedTestData` function:

```typescript
// Add new test user
await prisma.user.create({
  email: 'newuser@example.com',
  passwordHash: await bcrypt.hash('password123', 10),
  // ... other fields
});
```

## Architecture

```
┌─────────────────────────────────────┐
│   Playwright Global Setup          │
│   (e2e/helpers/global-setup.ts)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Initialize In-Memory DB           │
│   (packages/backend/.../db-setup.ts)│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Create Schema                     │
│   (from Prisma schema)              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Seed Test Data                    │
│   (e2e/helpers/db-helper.ts)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Backend Uses In-Memory DB         │
│   (packages/backend/src/utils/prisma)│
└─────────────────────────────────────┘
```

## Files

- `packages/backend/src/__tests__/e2e/db-setup.ts` - In-memory database setup
- `e2e/helpers/db-helper.ts` - Database helpers and seeding
- `e2e/helpers/global-setup.ts` - Playwright global setup
- `e2e/helpers/global-teardown.ts` - Playwright global teardown
- `packages/backend/src/utils/prisma.ts` - Prisma client with in-memory support







