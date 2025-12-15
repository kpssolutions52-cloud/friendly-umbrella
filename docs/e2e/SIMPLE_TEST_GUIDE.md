# Simple Guide to Test E2E Locally

## The Easiest Way

E2E tests use TestContainers to automatically spin up a PostgreSQL database. Here's how to run them:

### Step 1: Use Your Existing Database

If you already have a development database running, you can use it for tests:

```bash
# Just run the tests - they'll use your existing database
playwright test --ui
```

**Note**: Tests will clean up data between runs, but it's safer to use a separate test database.

### Step 2: Create a Test Database (Recommended)

1. **Create database**:
   ```sql
   CREATE DATABASE construction_pricing_e2e_test;
   ```

2. **Set environment variable**:
   ```bash
   # Windows PowerShell
   $env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/construction_pricing_e2e_test?schema=public"
   ```

3. **Run migrations**:
   ```bash
   cd packages/backend
   $env:DATABASE_URL=$env:TEST_DATABASE_URL
   npx prisma migrate deploy
   ```

4. **Run tests**:
   ```bash
   cd ../..
   playwright test --ui
   ```

## Install Browsers (One-Time)

```bash
npm run test:e2e:install
```

## Run Tests

### Interactive UI (Best for First Time)
```bash
playwright test --ui
```

This opens a nice UI where you can:
- See all 261 tests
- Click to run any test
- Watch execution
- See results

### Run One Test
```bash
playwright test e2e/auth/authentication.spec.ts --headed
```

The `--headed` flag shows the browser so you can see what's happening.

### Run All Tests
```bash
playwright test
```

## What You'll See

- ✅ Backend starts automatically
- ✅ Frontend starts automatically
- ✅ Tests run
- ✅ Results shown

## Test Users

- Super Admin: `admin@system.com` / `admin123`
- Supplier: `supplier@example.com` / `password123`
- Company: `company@example.com` / `password123`

## Quick Commands

```bash
# Install browsers (one-time)
npm run test:e2e:install

# Run in UI mode (recommended)
playwright test --ui

# Run with browser visible
playwright test --headed

# Run specific test
playwright test e2e/auth/authentication.spec.ts

# View report
npm run test:e2e:report
```

That's it! The tests will automatically use TestContainers to create a PostgreSQL database for testing.







