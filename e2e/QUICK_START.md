# Quick Start - Testing E2E Locally

## Step 1: Install Browsers (One-Time Setup)

```bash
npm run test:e2e:install
```

This installs Chromium, Firefox, and WebKit browsers (~300MB download).

## Step 2: Run Your First Test

### Option A: Run in UI Mode (Recommended for First Time)
```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- See all 261 tests
- Click to run individual tests
- Watch test execution in real-time
- See detailed results

### Option B: Run a Single Simple Test
```bash
npx playwright test e2e/auth/authentication.spec.ts --project=chromium --headed
```

This runs one test file with the browser visible so you can see what's happening.

### Option C: Run All Tests
```bash
npm run test:e2e
```

Runs all 261 tests across all browsers (takes longer).

## Step 3: View Results

After tests complete, view the HTML report:
```bash
npm run test:e2e:report
```

Or open: `playwright-report/index.html`

## What Happens Automatically

When you run tests:
1. ✅ **TestContainers PostgreSQL** is initialized (Docker required)
2. ✅ **Backend server** starts on port 8000 (if not running)
3. ✅ **Frontend server** starts on port 3000 (if not running)
4. ✅ **Test data** is seeded (users, tenants, etc.)
5. ✅ **Tests run** against the TestContainers database
6. ✅ **Report generated** with results

## Test Users Available

- **Super Admin**: `admin@system.com` / `admin123`
- **Supplier Admin**: `supplier@example.com` / `password123`
- **Company Admin**: `company@example.com` / `password123`
- **Customer**: `test@example.com` / `password123`

## Quick Commands

```bash
# Install browsers (one-time)
npm run test:e2e:install

# Run in UI mode (best for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run specific test
npx playwright test e2e/auth/authentication.spec.ts

# Run all tests
npm run test:e2e

# View report
npm run test:e2e:report
```

## Troubleshooting

**Ports in use?** Stop existing servers or change ports in `playwright.config.ts`

**Browsers not found?** Run `npm run test:e2e:install`

**Tests timeout?** Check that servers are starting correctly

**Database errors?** 
- Make sure Docker is running (required for TestContainers)
- Check console for "✅ TestContainers database initialized"
- Verify Docker: `docker ps`

## Next Steps

1. ✅ Run `npm run test:e2e:install`
2. ✅ Run `npm run test:e2e:ui` to see all tests
3. ✅ Click on a test to run it
4. ✅ Watch it execute!

For more details, see `e2e/TESTING_LOCALLY.md`







