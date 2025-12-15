# Testing E2E Tests Locally

This guide will help you run E2E tests locally with TestContainers (PostgreSQL container).

## Prerequisites

1. **Node.js** (v20 or higher)
2. **Dependencies installed**: `npm install`
3. **Playwright browsers installed** (see below)

## Quick Start

### 1. Install Playwright Browsers

```bash
npm run test:e2e:install
```

This installs Chromium, Firefox, and WebKit browsers needed for testing.

### 2. Run All E2E Tests

```bash
npm run test:e2e
```

This will:
- ✅ Initialize TestContainers PostgreSQL database
- ✅ Start backend server (if not running)
- ✅ Start frontend server (if not running)
- ✅ Run all E2E tests
- ✅ Generate test report

### 3. Run Tests in UI Mode (Recommended for First Time)

```bash
npm run test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- See all tests
- Run tests individually
- Watch test execution
- Debug tests easily

### 4. Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

Runs tests with visible browser windows so you can see what's happening.

### 5. Debug a Specific Test

```bash
npm run test:e2e:debug
```

Opens Playwright's debugger where you can step through tests.

## Running Specific Tests

### Run a Single Test File

```bash
npx playwright test e2e/auth/super-admin-login.spec.ts
```

### Run Tests in a Specific Directory

```bash
npx playwright test e2e/auth/
```

### Run Tests Matching a Pattern

```bash
npx playwright test --grep "login"
```

### Run Tests for Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## View Test Results

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

Or open the report file directly:
```
playwright-report/index.html
```

## Test Data

The TestContainers database is automatically seeded with test users:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@system.com | admin123 |
| Supplier Admin | supplier@example.com | password123 |
| Company Admin | company@example.com | password123 |
| Customer | test@example.com | password123 |
| Service Provider | service@example.com | password123 |

## Troubleshooting

### Tests Fail to Start

**Issue**: Backend or frontend server not starting
- **Solution**: Make sure ports 8000 and 3000 are available
- **Check**: `npm run dev` should work independently

### Database Errors

**Issue**: "Database not initialized" errors
- **Solution**: Make sure Docker is running (required for TestContainers)
- **Check**: Look for "✅ TestContainers database initialized" in console output
- **Verify**: Run `docker ps` to confirm Docker is running

### Browser Not Found

**Issue**: "Executable doesn't exist" errors
- **Solution**: Run `npm run test:e2e:install` to install browsers

### Tests Timeout

**Issue**: Tests timeout waiting for servers
- **Solution**: Increase timeout in `playwright.config.ts` or check server logs
- **Check**: Verify servers are running: `curl http://localhost:8000/health`

### Port Already in Use

**Issue**: Port 8000 or 3000 already in use
- **Solution**: Stop existing servers or change ports in config
- **Check**: `netstat -ano | findstr :8000` (Windows) or `lsof -i :8000` (Mac/Linux)

## Example: Running Your First Test

1. **Install browsers** (one-time setup):
   ```bash
   npm run test:e2e:install
   ```

2. **Run a simple test**:
   ```bash
   npx playwright test e2e/auth/super-admin-login.spec.ts --headed
   ```

3. **Watch it run** - You'll see the browser open and the test execute

4. **Check results** - The test will pass or show what failed

## Development Workflow

### While Developing Tests

1. **Use UI mode** for interactive testing:
   ```bash
   npm run test:e2e:ui
   ```

2. **Use headed mode** to see what's happening:
   ```bash
   npm run test:e2e:headed
   ```

3. **Run specific tests** as you develop:
   ```bash
   npx playwright test e2e/auth/super-admin-login.spec.ts
   ```

### Before Committing

1. **Run all tests** to ensure nothing broke:
   ```bash
   npm run test:e2e
   ```

2. **Check the report** for any failures:
   ```bash
   npm run test:e2e:report
   ```

## What Gets Tested

The E2E tests cover:

- ✅ **Authentication**: Login, registration, logout
- ✅ **Products**: Create, read, update, delete products
- ✅ **Prices**: Set default prices, create private prices
- ✅ **Admin**: Tenant approval, user management
- ✅ **Dashboard**: Access control, statistics
- ✅ **End-to-End**: Complete workflows

## Tips

1. **Start with UI mode** - It's the easiest way to see what's happening
2. **Use headed mode** - See the browser to understand failures
3. **Run one test at a time** - Easier to debug
4. **Check the report** - Detailed information about failures
5. **Read test code** - Understand what each test does

## Next Steps

1. ✅ Install browsers: `npm run test:e2e:install`
2. ✅ Run a test: `npm run test:e2e:ui`
3. ✅ Implement test cases (they have TODO comments)
4. ✅ Add more tests as needed

Happy testing! 🚀







