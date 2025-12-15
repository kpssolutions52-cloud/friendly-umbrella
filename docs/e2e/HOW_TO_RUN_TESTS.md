# How to Run E2E Tests Locally

## Quick Start (3 Steps)

### Step 1: Install Browsers (One-Time Only)
```bash
npm run test:e2e:install
```

This downloads Chromium, Firefox, and WebKit browsers (~300MB).

### Step 2: Run Tests in UI Mode (Recommended)
```bash
npm run test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- See all 261 tests
- Click any test to run it
- Watch test execution
- See results immediately

### Step 3: View Results
After tests complete, view the HTML report:
```bash
npm run test:e2e:report
```

## All Available Commands

```bash
# Install browsers (one-time setup)
npm run test:e2e:install

# Run all tests (headless)
npm run test:e2e

# Run tests in UI mode (interactive - BEST for first time)
npm run test:e2e:ui

# Run tests with visible browser
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Generate new test cases
npm run test:e2e:generate
```

## Run Specific Tests

```bash
# Run one test file
npx playwright test e2e/auth/authentication.spec.ts

# Run tests in a directory
npx playwright test e2e/auth/

# Run tests matching a pattern
npx playwright test --grep "login"

# Run for specific browser only
npx playwright test --project=chromium
```

## What Happens When You Run Tests

1. ✅ **Backend server** starts automatically (port 8000)
2. ✅ **Frontend server** starts automatically (port 3000)
3. ✅ **TestContainers PostgreSQL** initializes (Docker required)
4. ✅ **Tests run** against the application
5. ✅ **Report generated** with results

## Test Users Available

The tests use these pre-seeded users:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@system.com | admin123 |
| Supplier Admin | supplier@example.com | password123 |
| Company Admin | company@example.com | password123 |
| Customer | test@example.com | password123 |

## Troubleshooting

### "Browsers not found"
```bash
npm run test:e2e:install
```

### "Port already in use"
- Stop existing servers on ports 8000 and 3000
- Or change ports in `playwright.config.ts`

### "Database connection error"
- Make sure Docker is running (required for TestContainers)
- Check that TestContainers can create containers: `docker ps`
- Verify console output shows "✅ TestContainers database initialized"

### Tests timeout
- Check that servers are starting correctly
- Increase timeout in `playwright.config.ts` if needed

## Best Practice: Start with UI Mode

For your first time running tests:

```bash
npm run test:e2e:ui
```

This gives you:
- Visual interface to see all tests
- Ability to run tests one at a time
- Real-time feedback
- Easy debugging

## Next Steps

1. ✅ Run `npm run test:e2e:install` (if not done)
2. ✅ Run `npm run test:e2e:ui`
3. ✅ Click on a test to run it
4. ✅ Watch it execute!

For more details, see:
- `e2e/SIMPLE_TEST_GUIDE.md` - Simple instructions
- `e2e/RUN_TESTS_LOCALLY.md` - Detailed guide
- `e2e/README.md` - Full documentation






