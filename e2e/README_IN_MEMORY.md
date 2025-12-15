# E2E Testing with In-Memory Database

## Quick Start

```bash
# Run E2E tests (automatically uses in-memory DB)
npm run test:e2e

# Generate new test cases
npm run test:e2e:generate
```

## What's Different?

E2E tests now use an **in-memory database** instead of requiring an external PostgreSQL connection. This means:

✅ **No database setup needed** - Just run the tests  
✅ **Faster execution** - In-memory operations are very fast  
✅ **Isolated tests** - Each run starts fresh  
✅ **CI/CD friendly** - Works anywhere without database configuration  

## How It Works

1. **Global Setup** runs before all tests
   - Creates in-memory PostgreSQL database using `pg-mem`
   - Creates all tables from Prisma schema
   - Seeds test data (users, tenants, etc.)

2. **Backend Integration**
   - Backend automatically detects `USE_IN_MEMORY_DB=true`
   - Uses in-memory database instead of external PostgreSQL

3. **Test Execution**
   - All tests run against the in-memory database
   - No external database connection needed

4. **Global Teardown** runs after all tests
   - Cleans up in-memory database

## Test Data

Pre-seeded test users:

- **Super Admin**: `admin@system.com` / `admin123`
- **Supplier Admin**: `supplier@example.com` / `password123`
- **Company Admin**: `company@example.com` / `password123`
- **Customer**: `test@example.com` / `password123`

## Generated Test Cases

22 test cases have been generated across 6 categories:

- **Auth** (7 tests): Registration, login, authentication flows
- **Products** (5 tests): CRUD operations, search, viewing
- **Prices** (3 tests): Default prices, private prices, viewing
- **Admin** (3 tests): Tenant approval, user management
- **Dashboard** (2 tests): Access control, statistics
- **End-to-End** (2 tests): Complete workflows

## Files Structure

```
e2e/
├── helpers/
│   ├── db-helper.ts          # Database helpers
│   ├── global-setup.ts       # Playwright global setup
│   └── global-teardown.ts    # Playwright global teardown
├── scripts/
│   └── generate-test-cases.ts  # Test case generator
├── auth/                     # Authentication tests
├── products/                 # Product tests
├── prices/                   # Price tests
├── admin/                    # Admin tests
├── dashboard/                # Dashboard tests
└── end-to-end/              # E2E workflow tests
```

## Next Steps

1. **Implement Test Cases**: The generated test files have TODO comments - implement the actual test logic
2. **Add More Tests**: Use the generator to create more test cases
3. **Run Tests**: Execute `npm run test:e2e` to run all tests

## Troubleshooting

### Tests fail with database errors

- Check that `USE_IN_MEMORY_DB=true` is set (automatically set by npm scripts)
- Verify global setup is running (check Playwright output)

### Test users not found

- Check `e2e/helpers/db-helper.ts` for seed data
- Verify password hashing is working

### Schema errors

- Ensure Prisma schema is up to date
- Check `packages/backend/src/__tests__/e2e/db-setup.ts` for schema creation

For more details, see `e2e/IN_MEMORY_DB_SETUP.md`.







