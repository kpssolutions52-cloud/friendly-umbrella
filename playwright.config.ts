import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

/**
 * Configure TypeScript to exclude Jest test files
 * Use Playwright-specific tsconfig that excludes Jest tests
 * Also set NODE_OPTIONS to prevent loading Jest test files
 */
process.env.TS_NODE_PROJECT = './playwright-tsconfig.json';
// Prevent Jest test files from being loaded
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --no-warnings';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Only match test files in e2e directory */
  testMatch: /.*\.spec\.ts$/,
  /* Ignore Jest test files */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/packages/**/src/__tests__/**',
    '**/packages/**/src/**/*.test.ts',
    '**/packages/**/src/**/*.spec.ts',
    '**/packages/backend/src/**/__tests__/**',
  ],
  /* Configure module resolution to exclude Jest tests */
  build: {
    // Exclude Jest test files from being loaded
    external: [
      '**/packages/**/src/__tests__/**',
      '**/packages/**/src/**/*.test.ts',
    ],
  },
  /* Global setup and teardown for TestContainers database */
  globalSetup: require.resolve('./e2e/helpers/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/helpers/global-teardown.ts'),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'html' : [
    ['html'],
    ['list'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Visual regression testing */
    ignoreHTTPSErrors: true,
  },
  
  /* Visual regression testing configuration */
  expect: {
    /* Maximum pixel difference for visual comparisons */
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
    /* Configure screenshot comparison */
    toMatchSnapshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: process.platform === 'win32' 
        ? 'cd packages/backend && npm run dev'
        : 'cd packages/backend && npm run dev',
      url: 'http://localhost:8000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        ...process.env,
      },
    },
    {
      command: process.platform === 'win32'
        ? 'cd packages/frontend && npm run dev'
        : 'cd packages/frontend && npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});

