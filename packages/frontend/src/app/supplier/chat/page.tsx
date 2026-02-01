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

type QuestionFlowType = 'add_product' | 'update_product' | 'fetch_products' | null;

interface QuestionFlow {
  type: QuestionFlowType;
  step: number;
  data: Record<string, any>;
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
  const [questionFlow, setQuestionFlow] = useState<QuestionFlow | null>(null);
  
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
    // If user is QS, redirect to QS chat
    if (user?.type === 'qs') {
      router.push('/chat');
      return;
    }
    // If user is not supplier, redirect to home
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

  const startQuestionFlow = (type: QuestionFlowType) => {
    setQuestionFlow({ type, step: 0, data: {} });
    
    let initialQuestion = '';
    if (type === 'add_product') {
      initialQuestion = 'What is the product name?';
    } else if (type === 'update_product') {
      initialQuestion = 'Which product would you like to update? (Enter product name)';
    } else if (type === 'fetch_products') {
      // Fetch products immediately
      handleFetchProducts();
      return;
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: initialQuestion,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleFetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiPost<{
        answer: string;
        action?: { type: string; data?: any };
      }>('/api/v1/supplier/chat', {
        command: 'Show my products',
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        action: response.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      refreshProducts();
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error?.error?.message || 'Failed to fetch products. Please try again.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setQuestionFlow(null);
    }
  };

  const processQuestionFlow = async (userInput: string) => {
    if (!questionFlow) return false;

    const { type, step, data } = questionFlow;
    let nextStep = step;
    let updatedData = { ...data };
    let nextQuestion = '';
    let shouldExecute = false;
    let command = '';

    if (type === 'add_product') {
      if (step === 0) {
        // Product name
        updatedData.productName = userInput.trim();
        nextStep = 1;
        nextQuestion = 'What is the price per unit? (e.g., 48)';
      } else if (step === 1) {
        // Price
        const price = parseFloat(userInput.trim());
        if (isNaN(price) || price <= 0) {
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Please enter a valid positive number for the price.',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return true;
        }
        updatedData.price = price;
        nextStep = 2;
        nextQuestion = 'What is the unit? (e.g., bag, kg, gallon) - Press Enter to use "unit" as default';
      } else if (step === 2) {
        // Unit
        updatedData.unit = userInput.trim() || 'unit';
        shouldExecute = true;
        command = `Add ${updatedData.productName} at $${updatedData.price} per ${updatedData.unit}`;
      }
    } else if (type === 'update_product') {
      if (step === 0) {
        // Product name
        updatedData.productName = userInput.trim();
        nextStep = 1;
        nextQuestion = 'What would you like to update?\n1. Price\n2. Product Name\n3. Unit\n\nEnter the number or name (e.g., "1" or "price")';
      } else if (step === 1) {
        // Update type
        const updateType = userInput.trim().toLowerCase();
        if (updateType === '1' || updateType === 'price') {
          updatedData.updateType = 'price';
          nextStep = 2;
          nextQuestion = 'What is the new price? (e.g., 50)';
        } else if (updateType === '2' || updateType === 'name' || updateType === 'product name') {
          updatedData.updateType = 'name';
          nextStep = 2;
          nextQuestion = 'What is the new product name?';
        } else if (updateType === '3' || updateType === 'unit') {
          updatedData.updateType = 'unit';
          nextStep = 2;
          nextQuestion = 'What is the new unit? (e.g., bag, kg, gallon)';
        } else {
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Please enter 1, 2, or 3 (or "price", "name", or "unit")',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return true;
        }
      } else if (step === 2) {
        // Update value
        if (updatedData.updateType === 'price') {
          const price = parseFloat(userInput.trim());
          if (isNaN(price) || price <= 0) {
            const errorMessage: Message = {
              role: 'assistant',
              content: 'Please enter a valid positive number for the price.',
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            return true;
          }
          updatedData.price = price;
          shouldExecute = true;
          command = `Update ${updatedData.productName} price to $${updatedData.price}`;
        } else if (updatedData.updateType === 'name') {
          updatedData.newProductName = userInput.trim();
          shouldExecute = true;
          command = `Rename ${updatedData.productName} to ${updatedData.newProductName}`;
        } else if (updatedData.updateType === 'unit') {
          updatedData.unit = userInput.trim();
          shouldExecute = true;
          command = `Change ${updatedData.productName} unit to ${updatedData.unit}`;
        }
      }
    }

    // Update flow state
    if (shouldExecute) {
      setQuestionFlow(null);
      // Execute the command
      await executeCommand(command);
    } else {
      setQuestionFlow({ type, step: nextStep, data: updatedData });
      const assistantMessage: Message = {
        role: 'assistant',
        content: nextQuestion,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    return true;
  };

  const executeCommand = async (command: string) => {
    setLoading(true);
    try {
      const response = await apiPost<{
        answer: string;
        action?: { type: string; data?: any };
      }>('/api/v1/supplier/chat', {
        command,
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');

    // Check if we're in a question flow
    const handled = await processQuestionFlow(userInput);
    if (handled) {
      return;
    }

    // Otherwise, process as natural language command
    await executeCommand(userInput);
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
          <div className="bg-white border-t border-gray-200">
            {/* Action Tags */}
            <div className="px-3 pt-2 pb-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startQuestionFlow('add_product')}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Add Product
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startQuestionFlow('fetch_products')}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Fetch Products
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startQuestionFlow('update_product')}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Update Product
                </Button>
                {questionFlow && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuestionFlow(null);
                      const cancelMessage: Message = {
                        role: 'assistant',
                        content: 'Question flow cancelled. You can start a new one or type a command.',
                        timestamp: new Date().toISOString(),
                      };
                      setMessages((prev) => [...prev, cancelMessage]);
                    }}
                    className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            
            {/* Input Field */}
            <div className="px-3 py-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    questionFlow
                      ? questionFlow.type === 'add_product'
                        ? questionFlow.step === 0
                          ? 'Enter product name...'
                          : questionFlow.step === 1
                          ? 'Enter price...'
                          : 'Enter unit (or press Enter for default)...'
                        : questionFlow.type === 'update_product'
                        ? questionFlow.step === 0
                          ? 'Enter product name...'
                          : questionFlow.step === 1
                          ? 'Enter update type (1, 2, or 3)...'
                          : 'Enter new value...'
                        : 'Enter your response...'
                      : 'Enter a command or use tags above...'
                  }
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
