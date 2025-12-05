import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  superAdminPage: Page;
  supplierAdminPage: Page;
  companyAdminPage: Page;
};

/**
 * Helper function to login via API and set authentication token
 */
async function loginViaAPI(page: Page, email: string, password: string): Promise<void> {
  const response = await page.request.post('http://localhost:8000/api/v1/auth/login', {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${response.statusText()}`);
  }

  const data = await response.json();
  
  if (!data.tokens?.accessToken) {
    throw new Error('No access token received from login');
  }

  // Set authentication token in localStorage
  await page.addInitScript((token) => {
    localStorage.setItem('accessToken', token);
  }, data.tokens.accessToken);

  // Also set refresh token if available
  if (data.tokens.refreshToken) {
    await page.addInitScript((token) => {
      localStorage.setItem('refreshToken', token);
    }, data.tokens.refreshToken);
  }

  // Set user data in localStorage if available
  if (data.user) {
    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
    }, data.user);
  }
}

/**
 * Helper function to register a new user via API
 */
async function registerViaAPI(page: Page, registrationData: {
  email: string;
  password: string;
  registrationType: string;
  tenantName?: string;
  tenantType?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  tenantId?: string;
}): Promise<any> {
  const response = await page.request.post('http://localhost:8000/api/v1/auth/register', {
    data: registrationData,
  });

  return {
    status: response.status(),
    ok: response.ok(),
    data: response.ok() ? await response.json() : null,
    error: !response.ok() ? await response.json().catch(() => ({ message: response.statusText() })) : null,
  };
}

export const test = base.extend<AuthFixtures>({
  /**
   * Authenticated page fixture - logs in as a regular user
   */
  authenticatedPage: async ({ page }, use) => {
    // Use test user credentials (you may need to seed these in your test setup)
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';
    
    await loginViaAPI(page, email, password);
    await page.goto('/');
    await use(page);
    
    // Cleanup: clear auth tokens
    await page.evaluate(() => {
      localStorage.clear();
    });
  },

  /**
   * Super admin page fixture
   */
  superAdminPage: async ({ page }, use) => {
    const email = process.env.TEST_SUPER_ADMIN_EMAIL || 'admin@system.com';
    const password = process.env.TEST_SUPER_ADMIN_PASSWORD || 'admin123';
    
    await loginViaAPI(page, email, password);
    await page.goto('/admin/dashboard');
    await use(page);
    
    // Cleanup
    await page.evaluate(() => {
      localStorage.clear();
    });
  },

  /**
   * Supplier admin page fixture
   */
  supplierAdminPage: async ({ page }, use) => {
    const email = process.env.TEST_SUPPLIER_ADMIN_EMAIL || 'supplier@example.com';
    const password = process.env.TEST_SUPPLIER_ADMIN_PASSWORD || 'password123';
    
    await loginViaAPI(page, email, password);
    await page.goto('/supplier/dashboard');
    await use(page);
    
    // Cleanup
    await page.evaluate(() => {
      localStorage.clear();
    });
  },

  /**
   * Company admin page fixture
   */
  companyAdminPage: async ({ page }, use) => {
    const email = process.env.TEST_COMPANY_ADMIN_EMAIL || 'company@example.com';
    const password = process.env.TEST_COMPANY_ADMIN_PASSWORD || 'password123';
    
    await loginViaAPI(page, email, password);
    await page.goto('/company/dashboard');
    await use(page);
    
    // Cleanup
    await page.evaluate(() => {
      localStorage.clear();
    });
  },
});

export { expect, loginViaAPI, registerViaAPI };

