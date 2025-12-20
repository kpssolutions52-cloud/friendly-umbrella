// Jest setup file - runs before each test file
/// <reference types="jest" />
import { beforeEachSetup, afterEachTeardown } from './globalSetup';

// Configure OpenAI mock for all tests
beforeAll(() => {
  // Ensure OpenAI API key is set to a mock value in test environment
  // This prevents accidental real API calls while allowing conditional logic to work
  if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'mock-api-key-for-testing';
  }
  
  // Set mock model if not already set
  if (!process.env.OPENAI_MODEL) {
    process.env.OPENAI_MODEL = 'gpt-4o-mini';
  }
});

// Setup before each test file
beforeEach(async () => {
  await beforeEachSetup();
});

// Teardown after each test file
afterEach(async () => {
  await afterEachTeardown();
});


