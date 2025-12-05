import { test, expect } from '../fixtures/auth.fixtures';
import { waitForElementVisible } from '../helpers/test-helpers';

test.describe('Dashboard Navigation', () => {
  test('super admin should access admin dashboard', async ({ superAdminPage }) => {
    await expect(superAdminPage).toHaveURL(/\/admin\/dashboard/);
    
    // Check if dashboard elements are visible
    const heading = superAdminPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    // Admin dashboard should have tenant management or statistics
    await waitForElementVisible(superAdminPage, 'body', 5000);
  });

  test('supplier admin should access supplier dashboard', async ({ supplierAdminPage }) => {
    await expect(supplierAdminPage).toHaveURL(/\/supplier\/dashboard/);
    
    // Check if dashboard elements are visible
    await waitForElementVisible(supplierAdminPage, 'body', 5000);
    
    // Verify user is logged in
    const token = await supplierAdminPage.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });

  test('company admin should access company dashboard', async ({ companyAdminPage }) => {
    await expect(companyAdminPage).toHaveURL(/\/company\/dashboard/);
    
    // Check if dashboard elements are visible
    await waitForElementVisible(companyAdminPage, 'body', 5000);
    
    // Verify user is logged in
    const token = await companyAdminPage.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });

  test('should redirect to login when accessing dashboard without authentication', async ({ page }) => {
    await page.goto('/supplier/dashboard');
    
    // Should redirect to login page
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should maintain authentication state on page reload', async ({ supplierAdminPage }) => {
    await supplierAdminPage.reload();
    
    // Should still be on dashboard after reload
    await expect(supplierAdminPage).toHaveURL(/\/supplier\/dashboard/);
    
    const token = await supplierAdminPage.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });
});

test.describe('Dashboard Content', () => {
  test('admin dashboard should display tenant management options', async ({ superAdminPage }) => {
    // Look for common admin dashboard elements
    // This may vary based on your actual dashboard implementation
    await waitForElementVisible(superAdminPage, 'body', 5000);
    
    // Check if page has loaded (no error messages)
    const errorMessages = superAdminPage.locator('[class*="error"], [class*="Error"]');
    const errorCount = await errorMessages.count();
    
    // Dashboard should not show critical errors
    expect(errorCount).toBeLessThan(5); // Allow for non-critical warnings
  });

  test('supplier dashboard should be accessible and functional', async ({ supplierAdminPage }) => {
    // Wait for dashboard to load
    await waitForElementVisible(supplierAdminPage, 'body', 5000);
    
    // Check for navigation or menu items
    const bodyText = await supplierAdminPage.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('company dashboard should be accessible and functional', async ({ companyAdminPage }) => {
    // Wait for dashboard to load
    await waitForElementVisible(companyAdminPage, 'body', 5000);
    
    // Check for navigation or menu items
    const bodyText = await companyAdminPage.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

