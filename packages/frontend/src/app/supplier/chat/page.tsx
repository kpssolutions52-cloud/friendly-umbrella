'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiPost, apiGet } from '@/lib/api';
import { Send, Loader2, ChevronLeft, ChevronRight, Package, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: {
    type: string;
    data?: any;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierChatPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dashboard state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  // Redirect if not authenticated or not supplier
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.type !== 'supplier' && user?.tenant?.type !== 'supplier') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Load products on mount and when needed
  useEffect(() => {
    if (isAuthenticated && (user?.type === 'supplier' || user?.tenant?.type === 'supplier')) {
      loadProducts();
    }
  }, [isAuthenticated, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiGet<{ products: Product[] }>(
        '/api/v1/products?supplier=true'
      );
      setProducts(response.products || []);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const refreshProducts = async () => {
    try {
      setRefreshing(true);
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiPost<{
        answer: string;
        action?: { type: string; data?: any };
      }>('/api/v1/supplier/chat', {
        command: userMessage.content,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        action: response.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If action was performed, refresh products dashboard
      if (response.action && (
        response.action.type === 'price_updated' ||
        response.action.type === 'product_added' ||
        response.action.type === 'product_deleted' ||
        response.action.type === 'product_updated'
      )) {
        // Highlight the affected product
        if (response.action.data?.product?.id) {
          setHighlightedProductId(response.action.data.product.id);
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedProductId(null);
          }, 3000);
        }
        
        // Small delay to ensure backend has processed the change
        setTimeout(() => {
          refreshProducts();
        }, 500);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error?.error?.message || 'Failed to process command. Please try again.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Check both new schema (type) and old schema (tenant.type)
  if (!isAuthenticated || (user?.type !== 'supplier' && user?.tenant?.type !== 'supplier')) {
    return null; // Will redirect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat (1/3, can be minimized) */}
        <div
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
            chatMinimized ? 'w-0 hidden' : 'w-full md:w-1/3'
          }`}
        >
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI Assistant</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Natural language commands
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatMinimized(true)}
              className="md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-2xl mb-3">💬</div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Start a conversation
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Try these commands:
                </p>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  <div className="bg-green-50 p-2 rounded text-xs text-gray-700">
                    "Update cement price to $48"
                  </div>
                  <div className="bg-green-50 p-2 rounded text-xs text-gray-700">
                    "Add paint at $25 per gallon"
                  </div>
                  <div className="bg-green-50 p-2 rounded text-xs text-gray-700">
                    "Show my products"
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-green-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    <span className="text-gray-500 text-xs">Processing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-3 py-2">
            <div className="flex gap-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a command..."
                disabled={loading}
                className="flex-1 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="sm"
                className="px-3 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Dashboard (2/3) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Dashboard Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {chatMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatMinimized(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Dashboard
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshProducts}
              disabled={refreshing || loadingProducts}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No products yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Use the AI chat to add your first product
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      Try saying:
                    </p>
                    <p className="text-xs text-blue-700">
                      "Add cement at $48 per bag"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-300 ${
                      highlightedProductId === product.id
                        ? 'border-green-500 shadow-lg ring-2 ring-green-200 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 flex-1">
                        {product.name}
                      </h3>
                      {refreshing && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          / {product.unit}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                        Updated: {new Date(product.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
