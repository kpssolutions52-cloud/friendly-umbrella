# Backend Integration Test Suite

This directory contains comprehensive integration tests for the backend API. The tests cover all routes and functionality of the Construction Pricing Platform.

## Test Structure

```
__tests__/
├── setup/                  # Test setup utilities
│   ├── testSetup.ts       # Database setup and teardown
│   ├── appSetup.ts        # Express app setup for testing
│   └── globalSetup.ts     # Global test configuration
├── helpers/               # Test helper functions
│   ├── authHelpers.ts    # Authentication test utilities
│   └── testHelpers.ts    # General test utilities
└── integration/          # Integration test files
    ├── auth.integration.test.ts
    ├── products.integration.test.ts
    ├── prices.integration.test.ts
    ├── superAdmin.integration.test.ts
    └── tenantAdmin.integration.test.ts
```

## Prerequisites

1. **Test Database**: You need a separate test database. Set the `TEST_DATABASE_URL` environment variable:
   ```bash
   TEST_DATABASE_URL=postgresql://user:password@localhost:5432/construction_pricing_test?schema=public
   ```

2. **Dependencies**: All required dependencies are included in `package.json`:
   - `jest` - Test framework
   - `supertest` - HTTP assertions for Express
   - `ts-jest` - TypeScript support for Jest

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- auth.integration.test.ts
```

## Test Coverage

### Auth Routes (`auth.integration.test.ts`)
- ✅ User registration (new supplier, new company)
- ✅ User login (super admin, tenant admin)
- ✅ Get current user (`/auth/me`)
- ✅ Get active tenants for registration
- ✅ Error handling (invalid credentials, duplicate email, etc.)

### Product Routes (`products.integration.test.ts`)
- ✅ Create product (supplier only)
- ✅ List products with pagination
- ✅ Get product by ID
- ✅ Update product
- ✅ Delete product
- ✅ Get supplier statistics
- ✅ Filtering and search

### Price Routes (`prices.integration.test.ts`)
- ✅ Update default price
- ✅ Create private price (with price or discount)
- ✅ Update private price
- ✅ Search products with prices (company)
- ✅ Get product price (company)
- ✅ Price validation and error handling

### Super Admin Routes (`superAdmin.integration.test.ts`)
- ✅ Get pending tenants
- ✅ Get all tenants (with filters)
- ✅ Approve/reject tenants
- ✅ Create super admin
- ✅ Get all super admins
- ✅ Toggle tenant status
- ✅ Get system statistics

### Tenant Admin Routes (`tenantAdmin.integration.test.ts`)
- ✅ Get pending users
- ✅ Get all users in tenant (with filters)
- ✅ Create new user (pending)
- ✅ Approve/reject users
- ✅ Get tenant statistics

## Test Utilities

### Authentication Helpers

```typescript
import { createTestSuperAdmin, createTestTenantAdmin } from '../helpers/authHelpers';

// Create a super admin user
const superAdmin = await createTestSuperAdmin(prisma, 'admin@test.com', 'password123');

// Create a tenant admin
const tenantAdmin = await createTestTenantAdmin(prisma, tenantId, {
  email: 'admin@tenant.com',
  password: 'password123',
});
```

### Test Helpers

```typescript
import { randomEmail, getErrorMessage } from '../helpers/testHelpers';

// Generate random email
const email = randomEmail();

// Extract error message from API response
const errorMsg = getErrorMessage(response);
```

## Test Database Setup

Tests use TestContainers to automatically spin up a PostgreSQL database container. This means:

1. **No manual setup required** - TestContainers handles everything automatically
2. **Isolated** - Each test run gets a fresh database container
3. **Fast** - Container starts quickly and is automatically cleaned up
4. **Consistent** - Same database setup every time

### Prerequisites

**Docker Desktop must be running** for TestContainers to work:

1. Open Docker Desktop application
2. Wait until Docker Desktop shows "Docker Desktop is running"
3. Verify with: `docker ps`

### How It Works

When you run `npm run test:integration`:

1. **TestContainers starts** - A PostgreSQL 15 container is automatically started
2. **Schema is created** - Prisma schema is automatically pushed to the database
3. **Tests run** - All integration tests execute against the TestContainers database
4. **Cleanup** - Container is automatically stopped after tests complete

**No manual database setup or environment variables needed!** TestContainers handles everything.

## Writing New Tests

### Test Structure

```typescript
describe('Route Name', () => {
  let app: Express;
  let prisma: PrismaClient;
  
  beforeAll(async () => {
    // Setup database and app
    await setupTestDatabase();
    prisma = getTestPrisma();
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clean database and create test data
    await cleanTestDatabase();
    // Create test fixtures
  });

  afterAll(async () => {
    // Cleanup
    await closeTestDatabase();
  });

  describe('POST /api/v1/route', () => {
    it('should do something', async () => {
      const response = await request(app)
        .post('/api/v1/route')
        .set('Authorization', `Bearer ${token}`)
        .send({ /* data */ });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean database between tests
3. **Fixtures**: Use helper functions to create test data
4. **Assertions**: Test both success and error cases
5. **Authentication**: Test with and without authentication
6. **Authorization**: Test role-based access control

## Troubleshooting

### Docker Not Running

**Error: `container runtime` or `Docker` related errors**

TestContainers requires Docker Desktop to be running:

1. **Start Docker Desktop:**
   - Open Docker Desktop application
   - Wait until it shows "Docker Desktop is running"
   - Verify with: `docker ps`

2. **Check Docker is accessible:**
   ```bash
   docker ps
   ```
   Should return a list of containers (or empty list if no containers running)

3. **On Windows:** Make sure Docker Desktop is fully started before running tests

### EPERM Error (Windows File Locking)

If you see an `EPERM: operation not permitted` error when running tests:
- This is a Windows-specific issue where Prisma's query engine DLL is locked
- The tests will continue - Prisma client is likely already generated
- If tests fail, try running manually: `npx prisma generate --schema=packages/backend/prisma/schema.prisma`
- Close any other processes that might be using the Prisma client (IDEs, other test runs, etc.)

### Container Fails to Start

If TestContainers fails to start the PostgreSQL container:

1. **Check Docker resources:**
   - Docker Desktop → Settings → Resources
   - Ensure enough memory/CPU allocated (at least 2GB RAM)

2. **Check for port conflicts:**
   - TestContainers uses random ports, but if you have many containers, ports might be exhausted
   - Restart Docker Desktop to free up ports

3. **Check Docker logs:**
   ```bash
   docker logs <container-id>
   ```

### Tests Fail with Database Connection Error

If you see database connection errors:

1. **Verify TestContainers started:**
   - Check console output for "✅ PostgreSQL container started"
   - If not, see "Docker Not Running" above

2. **Check container is running:**
   ```bash
   docker ps
   ```
   Should show a PostgreSQL container running

3. **Check Prisma schema exists:**
   - Verify `packages/backend/prisma/schema.prisma` exists
   - Schema should be valid Prisma schema

### Tests Fail with "Table does not exist"
- Run Prisma migrations on test database
- Check schema.prisma is up to date

### Tests are Slow
- Use a dedicated test database (not shared with dev)
- Consider using SQLite for faster tests (modify testSetup.ts)

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  env:
    TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  run: |
    npm run test:integration
```

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 85%

Run `npm run test:coverage` to see current coverage.


