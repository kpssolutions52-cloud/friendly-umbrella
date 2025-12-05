import { test, expect } from '../fixtures/auth.fixtures';

test.describe('Visual Regression Tests', () => {
  test('login page should match snapshot', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot and compare
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('registration page should match snapshot', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('admin dashboard should match snapshot', async ({ superAdminPage }) => {
    await superAdminPage.goto('/admin/dashboard');
    await superAdminPage.waitForLoadState('networkidle');
    
    await expect(superAdminPage).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200, // Allow more differences for dynamic content
    });
  });

  test('supplier dashboard should match snapshot', async ({ supplierAdminPage }) => {
    await supplierAdminPage.goto('/supplier/dashboard');
    await supplierAdminPage.waitForLoadState('networkidle');
    
    await expect(supplierAdminPage).toHaveScreenshot('supplier-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('company dashboard should match snapshot', async ({ companyAdminPage }) => {
    await companyAdminPage.goto('/company/dashboard');
    await companyAdminPage.waitForLoadState('networkidle');
    
    await expect(companyAdminPage).toHaveScreenshot('company-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('login form elements should match snapshot', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Screenshot of just the form
    const form = page.locator('form');
    await expect(form).toHaveScreenshot('login-form.png', {
      maxDiffPixels: 50,
    });
  });

  test('registration form should match snapshot', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // Screenshot of registration form
    const form = page.locator('form');
    await expect(form).toHaveScreenshot('registration-form.png', {
      maxDiffPixels: 50,
    });
  });

  test('error messages should match snapshot', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Trigger error by submitting invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    const errorMessage = page.locator('[class*="bg-red-50"], [class*="error"]');
    const errorCount = await errorMessage.count();
    
    if (errorCount > 0) {
      await expect(errorMessage.first()).toHaveScreenshot('error-message.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('mobile viewport - login page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('tablet viewport - dashboard', async ({ supplierAdminPage }) => {
    await supplierAdminPage.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await supplierAdminPage.goto('/supplier/dashboard');
    await supplierAdminPage.waitForLoadState('networkidle');
    
    await expect(supplierAdminPage).toHaveScreenshot('supplier-dashboard-tablet.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});

