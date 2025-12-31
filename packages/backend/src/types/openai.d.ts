// TypeScript declaration file for OpenAI module
// This allows TypeScript to compile even if the openai package is not installed
// During tests, Jest will use the mock from __mocks__/openai.ts

declare module 'openai' {
  interface ChatCompletionMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string | null;
  }

  interface ChatCompletionChoice {
    message: ChatCompletionMessage;
    finish_reason?: string;
  }

  interface ChatCompletion {
    choices: ChatCompletionChoice[];
  }

  interface ChatCompletionCreateParams {
    model: string;
    messages: Array<{ role: string; content: string }>;
    response_format?: { type: string };
    temperature?: number;
  }

  class OpenAI {
    constructor(config?: { apiKey?: string });
    
    chat: {
      completions: {
        create(params: ChatCompletionCreateParams): Promise<ChatCompletion>;
      };
    };
  }

  export default OpenAI;
}







