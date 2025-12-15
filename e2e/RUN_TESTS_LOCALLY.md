# Running E2E Tests Locally

## Quick Start (Recommended)

### Option 1: Use Test Database (Simplest)

1. **Create test database**:
   ```bash
   # Using psql or your database client
   CREATE DATABASE construction_pricing_e2e_test;
   ```

2. **Set environment variable**:
   ```bash
   # Windows PowerShell
   $env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/construction_pricing_e2e_test?schema=public"
   
   # Linux/Mac
   export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/construction_pricing_e2e_test?schema=public
   ```

3. **Run migrations**:
   ```bash
   cd packages/backend
   DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
   # Or on Windows:
   $env:DATABASE_URL=$env:TEST_DATABASE_URL; npx prisma migrate deploy
   ```

4. **Run tests** (without in-memory DB flag):
   ```bash
   playwright test
   ```

### Option 2: Use Existing Database

If you have a development database running:

1. **Set TEST_DATABASE_URL** to point to your dev database
2. **Run tests**:
   ```bash
   TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/construction_pricing?schema=public playwright test
   ```

## Install Browsers (One-Time)

```bash
npm run test:e2e:install
```

## Run Tests

### Run All Tests
```bash
playwright test
```

### Run in UI Mode (Best for Development)
```bash
playwright test --ui
```

### Run with Visible Browser
```bash
playwright test --headed
```

### Run Specific Test
```bash
playwright test e2e/auth/authentication.spec.ts
```

### Run Tests for One Browser
```bash
playwright test --project=chromium
```

## View Results

```bash
npm run test:e2e:report
```

Or open: `playwright-report/index.html`

## What Happens

1. ✅ Backend server starts (if not running)
2. ✅ Frontend server starts (if not running)  
3. ✅ Tests run against the test database
4. ✅ Report generated

## Test Data

The tests use the seeded test users:
- Super Admin: `admin@system.com` / `admin123`
- Supplier Admin: `supplier@example.com` / `password123`
- Company Admin: `company@example.com` / `password123`

## Troubleshooting

**Ports in use?** Stop existing servers or change ports

**Database connection error?** Check TEST_DATABASE_URL is set correctly

**Tests timeout?** Increase timeout or check server logs

**Browsers not found?** Run `npm run test:e2e:install`

## Note on In-Memory Database

The in-memory database setup (pg-mem) is available but requires additional work to fully integrate with Prisma. For now, using a test database is the recommended approach.

See `e2e/IN_MEMORY_DB_NOTE.md` for more details.







