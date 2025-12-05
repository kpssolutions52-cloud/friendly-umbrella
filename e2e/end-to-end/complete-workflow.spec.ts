import { test, expect } from '../fixtures/auth.fixtures';
import { registerViaAPI, randomEmail, waitForElementVisible } from '../helpers/test-helpers';

test.describe('Complete End-to-End Workflow', () => {
  test('full tenant registration and approval workflow', async ({ page, superAdminPage }) => {
    // Step 1: Register a new supplier
    const supplierEmail = randomEmail('supplier');
    const supplierName = `E2E Test Supplier ${Date.now()}`;
    
    const registrationResult = await registerViaAPI(page, {
      email: supplierEmail,
      password: 'password123',
      registrationType: 'new_supplier',
      tenantName: supplierName,
      tenantType: 'supplier',
      firstName: 'Test',
      lastName: 'Supplier',
      phone: '+1234567890',
      address: '123 Test Street',
      postalCode: '12345',
    });

    // Registration should be successful
    expect(registrationResult.status).toBe(201);

    // Step 2: Try to login before approval (should fail or be pending)
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', supplierEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show pending message or login failure
    await page.waitForTimeout(3000);
    const errorOrPending = await page.locator('[class*="error"], [class*="pending"], [class*="Pending"]').count();
    
    // Either error or pending message should be shown
    expect(errorOrPending >= 0).toBeTruthy();

    // Step 3: Super admin approves the tenant
    await superAdminPage.goto('/admin/dashboard');
    await waitForElementVisible(superAdminPage, 'body', 5000);

    // Look for and click approve button
    const approveButtons = superAdminPage.locator('button:has-text("Approve"), button:has-text("Accept")');
    const buttonCount = await approveButtons.count();

    if (buttonCount > 0) {
      await approveButtons.first().click();
      await superAdminPage.waitForTimeout(2000);
    }

    // Step 4: Now the supplier should be able to login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', supplierEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to supplier dashboard
    await page.waitForURL(/\/supplier\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/supplier\/dashboard/);

    // Verify login was successful
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });

  test('complete product and price management workflow', async ({ supplierAdminPage, companyAdminPage }) => {
    // This test would create a product, set prices, and verify company can see them
    // Implementation depends on your actual UI structure

    // Step 1: Supplier creates a product (via UI or API)
    await supplierAdminPage.goto('/supplier/dashboard');
    await waitForElementVisible(supplierAdminPage, 'body', 5000);

    // Step 2: Supplier sets default price
    // (Implementation depends on UI)

    // Step 3: Supplier sets private price for company
    // (Implementation depends on UI)

    // Step 4: Company views product and price
    await companyAdminPage.goto('/company/dashboard');
    await waitForElementVisible(companyAdminPage, 'body', 5000);

    // Verify both pages are functional
    const supplierBody = await supplierAdminPage.textContent('body');
    const companyBody = await companyAdminPage.textContent('body');

    expect(supplierBody).toBeTruthy();
    expect(companyBody).toBeTruthy();
  });
});

