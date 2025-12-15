module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  passWithNoTests: true,
  testTimeout: 120000, // 120 seconds for integration tests (TestContainers can take time)
  globalSetup: '<rootDir>/src/__tests__/setup/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/setup/jest.globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest.setup.ts'],
};












