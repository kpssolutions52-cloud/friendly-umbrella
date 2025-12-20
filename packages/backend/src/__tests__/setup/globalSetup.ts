import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from './testSetup';

/**
 * Global setup for all integration tests
 * This runs once before all tests
 */
export async function globalSetup() {
  // Set test environment variables FIRST, before any modules are imported
  // This ensures Prisma client and other modules use test configuration
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests-minimum-32-characters-long';
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-integration-tests-minimum-32-characters-long';
  }
  if (!process.env.JWT_EXPIRES_IN) {
    process.env.JWT_EXPIRES_IN = '1h';
  }
  if (!process.env.JWT_REFRESH_EXPIRES_IN) {
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  }
  if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'mock-api-key-for-testing';
  }
  if (!process.env.OPENAI_MODEL) {
    process.env.OPENAI_MODEL = 'gpt-4o-mini';
  }
  
  // Remove any beforeExit handlers that might have been registered before NODE_ENV was set
  // This prevents infinite loops from Prisma disconnect handlers
  const listeners = process.listeners('beforeExit');
  listeners.forEach(listener => {
    // Remove all beforeExit listeners to prevent loops
    // The test setup will handle cleanup explicitly
    try {
      process.removeListener('beforeExit', listener);
    } catch {
      // Ignore errors removing listeners
    }
  });
  
  // Initialize test database
  await setupTestDatabase();
}

/**
 * Global teardown for all integration tests
 * This runs once after all tests
 */
export async function globalTeardown() {
  await closeTestDatabase();
}

/**
 * Setup before each test file
 */
export async function beforeEachSetup() {
  // Clean database before each test file
  await cleanTestDatabase();
}

/**
 * Teardown after each test file
 */
export async function afterEachTeardown() {
  // Optional: Add cleanup logic if needed
}


