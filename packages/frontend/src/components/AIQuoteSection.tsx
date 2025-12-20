'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Zap, Package } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: ProductMatch[];
  summary?: string;
  reasoning?: string;
  suggestions?: string[];
}

interface ProductMatch {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  type: 'product' | 'service';
  categoryName: string | null;
  supplierName: string;
  supplierId: string;
  unit: string;
  price: number | null;
  priceType: 'default' | 'private' | null;
  currency: string | null;
}

interface AIQuoteResponse {
  products: ProductMatch[];
  summary: string;
  reasoning: string;
  suggestions?: string[];
}

export function AIQuoteSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI quote assistant. Tell me what products or services you\'re looking for, and I\'ll help you find the best matches from our supplier network.\n\nFor example:\n- "I need concrete for a construction project"\n- "Looking for plumbing services"\n- "Need electrical supplies"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // AI search requests can take longer (30-60 seconds) due to LLM processing
      const response = await apiRequest<{ success: boolean; data: AIQuoteResponse }>(
        '/api/v1/quotes/ai-search',
        {
          method: 'POST',
          body: JSON.stringify({ prompt: input.trim() }),
        },
        true, // retryOn401
        60000 // 60 second timeout for AI requests
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.summary,
        timestamp: new Date(),
        products: response.data.products,
        reasoning: response.data.reasoning,
        suggestions: response.data.suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Quote Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error?.error?.message || error?.message || 'Unable to process your request. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to search for products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header - ChatGPT style */}
      <div className="flex items-center justify-center p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Quote Assistant</h2>
            <p className="text-sm text-blue-100">Tell me what you need, I'll find it for you</p>
          </div>
        </div>
      </div>

      {/* Messages - Full height scrollable area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 shadow-sm rounded-bl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed">
                {message.content}
              </div>
              
              {/* Reasoning (if available) */}
              {message.reasoning && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Why these results?</p>
                  <p className="text-sm text-gray-600">{message.reasoning}</p>
                </div>
              )}

              {/* Products */}
              {message.products && message.products.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-semibold text-gray-700">
                      Found {message.products.length} {message.products.length === 1 ? 'match' : 'matches'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {message.products.map((product) => (
                      <div key={product.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-900">{product.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{product.supplierName}</p>
                          </div>
                          {product.price && (
                            <div className="text-right">
                              <div className="text-sm font-bold text-green-600">
                                {product.currency} {product.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">{product.unit}</div>
                            </div>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {product.categoryName && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {product.categoryName}
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                            {product.type === 'product' ? 'Product' : 'Service'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm rounded-bl-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Searching for products...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you're looking for..."
              disabled={isLoading}
              className="flex-1 h-12 text-base"
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 h-12 px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Ask me anything about products or services you need for your project
          </p>
        </div>
      </form>
    </div>
  );
}
