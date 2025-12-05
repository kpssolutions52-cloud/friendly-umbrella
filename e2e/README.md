# End-to-End (E2E) Test Suite

This directory contains comprehensive end-to-end tests for the Construction Pricing Platform using Playwright.

## Overview

The E2E test suite covers the full application functionality from frontend to backend, including:

- ✅ Authentication flows (login, registration)
- ✅ Dashboard navigation and access control
- ✅ Product management (create, read, update, delete)
- ✅ Price management (default prices, private prices)
- ✅ Tenant approval workflow
- ✅ User management across different roles
- ✅ Complete end-to-end workflows

## Prerequisites

1. **Node.js** (v20 or higher)
2. **Playwright browsers** installed
3. **Backend and Frontend servers** running (or use `npm run test:e2e` which starts them automatically)

## Installation

```bash
# Install dependencies (already included in root package.json)
npm install

# Install Playwright browsers
npm run test:e2e:install
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

This command will:
- Start the backend server (if not already running)
- Start the frontend server (if not already running)
- Run all E2E tests
- Generate a test report

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

Opens Playwright's interactive UI mode where you can:
- See all tests
- Run tests individually
- Debug tests
- Watch test execution in real-time

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

Runs tests with the browser visible (useful for debugging).

### Debug Tests

```bash
npm run test:e2e:debug
```

Opens Playwright's debugger where you can step through tests.

### View Test Report

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

### Run Specific Test File

```bash
npx playwright test e2e/auth/authentication.spec.ts
```

### Run Tests for Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

```
e2e/
├── fixtures/              # Playwright fixtures and helpers
│   └── auth.fixtures.ts  # Authentication fixtures
├── helpers/              # Test helper functions
│   └── test-helpers.ts  # Utility functions
├── auth/                 # Authentication tests
│   └── authentication.spec.ts
├── dashboard/            # Dashboard navigation tests
│   └── dashboard.spec.ts
├── products/             # Product management tests
│   └── products.spec.ts
├── prices/               # Price management tests
│   └── prices.spec.ts
├── admin/                # Admin functionality tests
│   ├── tenant-approval.spec.ts
│   └── user-management.spec.ts
└── end-to-end/           # Complete workflow tests
    └── complete-workflow.spec.ts
```

## Environment Variables

Create a `.env` file in the project root for test-specific configurations:

```env
# Test user credentials
TEST_SUPER_ADMIN_EMAIL=admin@system.com
TEST_SUPER_ADMIN_PASSWORD=admin123

TEST_SUPPLIER_ADMIN_EMAIL=supplier@example.com
TEST_SUPPLIER_ADMIN_PASSWORD=password123

TEST_COMPANY_ADMIN_EMAIL=company@example.com
TEST_COMPANY_ADMIN_PASSWORD=password123

TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

## Test Fixtures

### Authentication Fixtures

Pre-authenticated page fixtures are available for different user roles:

```typescript
test('example test', async ({ superAdminPage }) => {
  // Already logged in as super admin
  await superAdminPage.goto('/admin/dashboard');
});

test('another test', async ({ supplierAdminPage }) => {
  // Already logged in as supplier admin
  await supplierAdminPage.goto('/supplier/dashboard');
});
```

Available fixtures:
- `authenticatedPage` - Regular authenticated user
- `superAdminPage` - Super admin user
- `supplierAdminPage` - Supplier admin user
- `companyAdminPage` - Company admin user

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures/auth.fixtures';
import { waitForElementVisible } from '../helpers/test-helpers';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    await waitForElementVisible(page, 'selector');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Using Authentication Fixtures

```typescript
test('authenticated test', async ({ supplierAdminPage }) => {
  // Already logged in
  await supplierAdminPage.goto('/supplier/dashboard');
  // Test authenticated functionality
});
```

### API Testing with Playwright

```typescript
test('API test', async ({ page }) => {
  const response = await page.request.post('http://localhost:8000/api/v1/auth/login', {
    data: { email: 'test@example.com', password: 'password123' }
  });
  expect(response.ok()).toBeTruthy();
});
```

## CI/CD Integration

E2E tests are automatically run in the CI/CD pipeline. The tests will:

1. Start backend and frontend servers
2. Wait for servers to be ready
3. Run all E2E tests
4. Generate and upload test reports
5. Fail the build if tests fail

## Debugging Tests

### Debug Mode

```bash
npm run test:e2e:debug
```

### Screenshots and Videos

Screenshots are automatically taken on test failure. Videos are recorded for failed tests (if configured).

### Trace Viewer

Traces are collected for failed tests. View them with:

```bash
npx playwright show-trace trace.zip
```

## Best Practices

1. **Use fixtures** for authentication instead of logging in manually
2. **Wait for elements** using `waitForElementVisible` or Playwright's built-in waits
3. **Use data-testid** attributes in your UI for reliable selectors
4. **Keep tests independent** - each test should be able to run in isolation
5. **Clean up** test data after tests (handled automatically by fixtures)
6. **Use descriptive test names** that explain what is being tested
7. **Group related tests** using `test.describe()`

## Troubleshooting

### Tests Timeout

- Increase timeout in test: `test.setTimeout(60000)`
- Check if servers are running: `curl http://localhost:8000/health`

### Element Not Found

- Use Playwright's auto-waiting features
- Check if element is in an iframe or shadow DOM
- Verify selectors using Playwright Inspector: `npx playwright codegen`

### Authentication Issues

- Verify test user credentials in `.env` file
- Check if test users exist in the database
- Use fixtures for authentication instead of manual login

### Browser Installation Issues

```bash
# Reinstall browsers
npx playwright install --force
```

## Coverage

Current test coverage includes:

- ✅ User registration (all types)
- ✅ User login (all roles)
- ✅ Dashboard access control
- ✅ Product CRUD operations
- ✅ Price management
- ✅ Tenant approval workflow
- ✅ User management
- ✅ Complete end-to-end workflows

## Contributing

When adding new features:

1. Add corresponding E2E tests
2. Use existing fixtures and helpers
3. Follow the test structure conventions
4. Update this README if needed

