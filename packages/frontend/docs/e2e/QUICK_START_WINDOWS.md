# Quick Start - Running E2E Tests on Windows

## Step 1: Install Browsers (One-Time)

Open PowerShell or Command Prompt and run:

```powershell
npm run test:e2e:install
```

This installs the browsers needed for testing.

## Step 2: Run Tests

### Option A: Interactive UI Mode (Recommended)

```powershell
npm run test:e2e:ui
```

This opens a nice UI where you can:
- See all 261 tests
- Click any test to run it
- Watch execution in real-time
- See results immediately

### Option B: Run All Tests

```powershell
npm run test:e2e
```

Runs all tests and shows results in the terminal.

### Option C: Run with Visible Browser

```powershell
npm run test:e2e:headed
```

Runs tests with browser windows visible so you can see what's happening.

## Step 3: View Results

After tests complete:

```powershell
npm run test:e2e:report
```

Opens the HTML report in your browser.

## Run Specific Tests

```powershell
# Run one test file
npx playwright test e2e/auth/authentication.spec.ts

# Run tests in a directory
npx playwright test e2e/auth/

# Run tests matching text
npx playwright test --grep "login"
```

## What You Need

1. **Database**: Tests will use your existing database connection
   - Make sure `DATABASE_URL` is set in `packages/backend/.env`
   - Or set `TEST_DATABASE_URL` environment variable

2. **Ports Available**: 
   - Port 8000 (backend)
   - Port 3000 (frontend)

## Troubleshooting

### "Browsers not found"
```powershell
npm run test:e2e:install
```

### "Port already in use"
- Stop servers running on ports 8000 or 3000
- Or close the applications using those ports

### "Database connection error"
- Check `packages/backend/.env` has `DATABASE_URL` set
- Make sure your database is running
- Or create a test database and set `TEST_DATABASE_URL`

## Example: Run Your First Test

```powershell
# 1. Install browsers (one-time)
npm run test:e2e:install

# 2. Run in UI mode
npm run test:e2e:ui

# 3. In the UI, click on "auth/authentication.spec.ts"
# 4. Click "Run" to execute the test
# 5. Watch it run!
```

That's it! The tests will automatically:
- Start backend server
- Start frontend server  
- Run the tests
- Show results

## All Commands

```powershell
npm run test:e2e:install    # Install browsers (one-time)
npm run test:e2e            # Run all tests
npm run test:e2e:ui         # Run in UI mode (best!)
npm run test:e2e:headed     # Run with visible browser
npm run test:e2e:debug      # Debug mode
npm run test:e2e:report     # View HTML report
```

For more help, see `e2e/HOW_TO_RUN_TESTS.md`






