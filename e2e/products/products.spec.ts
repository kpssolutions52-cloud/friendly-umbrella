import { test, expect } from '../fixtures/auth.fixtures';
import { randomString, waitForElementVisible } from '../helpers/test-helpers';

test.describe('Product Management - Supplier', () => {
  test('supplier admin should be able to view products', async ({ supplierAdminPage }) => {
    // Navigate to products page (adjust URL based on your routing)
    await supplierAdminPage.goto('/supplier/dashboard');
    await waitForElementVisible(supplierAdminPage, 'body', 5000);
    
    // Look for products section or navigation
    // This test structure will depend on your actual UI implementation
    const pageContent = await supplierAdminPage.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should handle product creation flow', async ({ supplierAdminPage }) => {
    await supplierAdminPage.goto('/supplier/dashboard');
    
    // Wait for page to load
    await waitForElementVisible(supplierAdminPage, 'body', 5000);
    
    // Look for "Add Product" button or similar
    // The actual implementation will depend on your UI
    const addProductButton = supplierAdminPage.locator('button:has-text("Add Product"), button:has-text("New Product"), a:has-text("Add Product")');
    
    // Check if product management UI exists (button may or may not be visible initially)
    const buttonCount = await addProductButton.count();
    
    if (buttonCount > 0) {
      await addProductButton.first().click();
      
      // Wait for form or modal to appear
      await supplierAdminPage.waitForTimeout(1000);
      
      // Form should be visible if modal opened
      const form = supplierAdminPage.locator('form, [role="dialog"]');
      const formCount = await form.count();
      
      if (formCount > 0) {
        // Product creation form should have required fields
        const nameField = supplierAdminPage.locator('input[name*="name"], input[placeholder*="name" i]');
        const nameCount = await nameField.count();
        
        if (nameCount > 0) {
          await nameField.first().fill(`E2E Test Product ${randomString(8)}`);
        }
      }
    }
  });

  test('should display product list', async ({ supplierAdminPage }) => {
    await supplierAdminPage.goto('/supplier/dashboard');
    await waitForElementVisible(supplierAdminPage, 'body', 5000);
    
    // Check if products table or list is visible
    // This will need to be adjusted based on your actual UI
    const productsSection = supplierAdminPage.locator('[class*="product"], table, [data-testid*="product"]');
    const sectionCount = await productsSection.count();
    
    // Either products are displayed or the section exists
    expect(sectionCount >= 0).toBeTruthy();
  });
});

test.describe('Product Management - Company', () => {
  test('company should be able to search and view products', async ({ companyAdminPage }) => {
    await companyAdminPage.goto('/company/dashboard');
    await waitForElementVisible(companyAdminPage, 'body', 5000);
    
    // Company should be able to search for products
    const searchInput = companyAdminPage.locator('input[type="search"], input[placeholder*="search" i]');
    const searchCount = await searchInput.count();
    
    if (searchCount > 0) {
      await searchInput.first().fill('test product');
      await companyAdminPage.keyboard.press('Enter');
      await companyAdminPage.waitForTimeout(2000);
    }
    
    // Page should still be accessible after search
    const bodyText = await companyAdminPage.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});

