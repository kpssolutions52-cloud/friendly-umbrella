// Manual mock for OpenAI - this will be used automatically by Jest
// This prevents real API calls during testing and avoids TypeScript compilation errors

// Default mock response factory
const createDefaultMockResponse = () => ({
  choices: [{
    message: {
      content: JSON.stringify({
        productIds: [],
        summary: 'Mock AI response for testing',
        reasoning: 'This is a mocked response for integration tests',
        suggestions: []
      })
    }
  }]
});

// Create a mock function that can be reset and customized in tests
const mockCreate = jest.fn().mockResolvedValue(createDefaultMockResponse());

class MockOpenAI {
  chat = {
    completions: {
      create: mockCreate
    }
  };

  constructor(config?: { apiKey?: string }) {
    // Mock constructor - no-op
    // Config parameter accepted for compatibility but not used
  }
}

export default MockOpenAI;
export { mockCreate, createDefaultMockResponse };

