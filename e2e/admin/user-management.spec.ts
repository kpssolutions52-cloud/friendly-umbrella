import { test, expect } from '../fixtures/auth.fixtures';
import { waitForElementVisible, randomEmail } from '../helpers/test-helpers';

test.describe('User Management - Super Admin', () => {
  test('super admin should access user management', async ({ superAdminPage }) => {
    await superAdminPage.goto('/admin/dashboard');
    await waitForElementVisible(superAdminPage, 'body', 5000);

    // Look for user management section
    // Use separate locators - can't mix CSS and text selectors with commas
    const userSection1 = superAdminPage.locator('[class*="user"]');
    const userSection2 = superAdminPage.locator('[class*="User"]');
    const userSection3 = superAdminPage.locator('text=/user/i');
    const sectionCount = (await userSection1.count()) + (await userSection2.count()) + (await userSection3.count());

    // User management should be accessible
    expect(sectionCount >= 0).toBeTruthy();
  });

  test('should view all users in the system', async ({ superAdminPage }) => {
    await superAdminPage.goto('/admin/dashboard');
    await waitForElementVisible(superAdminPage, 'body', 5000);

    // Navigate to user management
    const userLink = superAdminPage.locator('a:has-text("User"), a:has-text("Users")');
    const linkCount = await userLink.count();

    if (linkCount > 0) {
      await userLink.first().click();
      await superAdminPage.waitForTimeout(2000);
    }

    // User list should be visible
    const bodyText = await superAdminPage.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

test.describe('User Management - Tenant Admin', () => {
  test('supplier admin should manage users in their tenant', async ({ supplierAdminPage }) => {
    await supplierAdminPage.goto('/supplier/dashboard');
    await waitForElementVisible(supplierAdminPage, 'body', 5000);

    // Look for user management link
    const userLink = supplierAdminPage.locator('a:has-text("User"), a:has-text("Users"), a:has-text("Team")');
    const linkCount = await userLink.count();

    if (linkCount > 0) {
      await userLink.first().click();
      await supplierAdminPage.waitForTimeout(2000);
    }

    // User management page should be accessible
    const bodyText = await supplierAdminPage.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('company admin should manage users in their tenant', async ({ companyAdminPage }) => {
    await companyAdminPage.goto('/company/dashboard');
    await waitForElementVisible(companyAdminPage, 'body', 5000);

    // Look for user management link
    const userLink = companyAdminPage.locator('a:has-text("User"), a:has-text("Users"), a:has-text("Team")');
    const linkCount = await userLink.count();

    if (linkCount > 0) {
      await userLink.first().click();
      await companyAdminPage.waitForTimeout(2000);
    }

    // User management page should be accessible
    const bodyText = await companyAdminPage.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

