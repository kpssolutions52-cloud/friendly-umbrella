'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiPost, apiGet, apiPut, apiDelete } from '@/lib/api';
import { Send, Loader2, ChevronLeft, ChevronRight, Package, Edit2, Trash2, Search, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  
  // Inventory manager state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
      // Ensure price is always a number
      const normalizedProducts = (response.products || []).map(product => ({
        ...product,
        price: typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price) || 0,
      }));
      setProducts(normalizedProducts);
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
      // Use longer timeout for AI chat requests
      const response = await apiPost<{
        answer: string;
        action?: { type: string; data?: any };
      }>('/api/v1/supplier/chat', {
        command: 'Show my products',
      }, true, 60000); // 60 second timeout

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        action: response.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      refreshProducts();
    } catch (error: any) {
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to fetch products. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorText}`,
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
      // Use longer timeout for AI chat requests (60 seconds) as they can take time
      const response = await apiPost<{
        answer: string;
        action?: { type: string; data?: any };
      }>('/api/v1/supplier/chat', {
        command,
      }, true, 60000); // 60 second timeout for AI requests

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
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to process command. Please try again.';
      
      // If it's a timeout error, check if it might be a price update that succeeded
      // by refreshing products to see if anything changed
      if (errorText.includes('timeout') || errorText.includes('Request timeout')) {
        // Refresh products to check if update succeeded
        await refreshProducts();
        
        // Show a message that suggests checking if the update worked
        const timeoutMessage: Message = {
          role: 'assistant',
          content: `⚠️ Request timed out, but the update may have succeeded. Please check your products list. If the price was updated, you'll see it there.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, timeoutMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${errorText}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
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

  // Filtered and sorted products for dashboard
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.unit.toLowerCase().includes(query) ||
          product.price.toString().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: 'name' | 'price' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'price' | 'updatedAt' }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
    );
  };

  const handleAddProduct = () => {
    setFormData({ name: '', price: '', unit: '' });
    setEditingProduct(null);
    setShowAddForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit,
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.unit) {
      return;
    }

    try {
      setSubmitting(true);
      if (editingProduct) {
        // Update existing product
        await apiPut(`/api/v1/products/${editingProduct.id}`, {
          name: formData.name,
          price: parseFloat(formData.price),
          unit: formData.unit,
        });
      } else {
        // Create new product
        await apiPost('/api/v1/products', {
          name: formData.name,
          price: parseFloat(formData.price),
          unit: formData.unit,
        });
      }
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', unit: '' });
      await loadProducts();
      
      // Add success message to chat
      const successMessage: Message = {
        role: 'assistant',
        content: editingProduct 
          ? `Product "${formData.name}" updated successfully!`
          : `Product "${formData.name}" added successfully!`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to save product. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorText}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      await apiDelete(`/api/v1/products/${productId}`);
      await loadProducts();
      
      // Add success message to chat
      const successMessage: Message = {
        role: 'assistant',
        content: `Product "${productName}" deleted successfully!`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to delete product. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorText}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
                  Inventory Manager
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {products.length} product{products.length !== 1 ? 's' : ''} in inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              <Button
                onClick={handleAddProduct}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white border-b border-gray-200 px-4 py-4">
              <h2 className="text-base font-semibold mb-3">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSubmitProduct} className="space-y-3">
                <div>
                  <Label htmlFor="dashboard-name" className="text-sm">Product Name *</Label>
                  <Input
                    id="dashboard-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Cement"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dashboard-price" className="text-sm">Price *</Label>
                    <Input
                      id="dashboard-price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                      placeholder="48.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dashboard-unit" className="text-sm">Unit *</Label>
                    <Input
                      id="dashboard-unit"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      required
                      placeholder="e.g., bag, ton, kg"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    size="sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      editingProduct ? 'Update Product' : 'Add Product'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                      setFormData({ name: '', price: '', unit: '' });
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filter Bar */}
          {products.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search products by name, price, or unit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sort and View Toggle */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50">
                    <span className="text-xs text-gray-600 whitespace-nowrap">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'updatedAt')}
                      className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="name">Name</option>
                      <option value="price">Price</option>
                      <option value="updatedAt">Last Updated</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {sortOrder === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex border rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none border-0"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none border-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results count */}
              {searchQuery && (
                <div className="mt-2 text-xs text-gray-500">
                  Showing {filteredAndSortedProducts.length} of {products.length} products
                </div>
              )}
            </div>
          )}

          {/* Products Display */}
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
                    Use the AI chat or click "Add Product" to add your first product
                  </p>
                  <Button onClick={handleAddProduct} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">No products match your search.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')} 
                    size="sm"
                  >
                    Clear Search
                  </Button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-300 ${
                      highlightedProductId === product.id
                        ? 'border-green-500 shadow-lg ring-2 ring-green-200 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 flex-1 pr-2">
                        {product.name}
                      </h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          ${(Number(product.price) || 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">/{product.unit}</span>
                      </div>
                      <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                        Updated: {new Date(product.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Product Name
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center">
                          Price
                          <SortIcon field="price" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center">
                          Last Updated
                          <SortIcon field="updatedAt" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className={`hover:bg-gray-50 ${
                          highlightedProductId === product.id ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${(Number(product.price) || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(product.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="hover:bg-blue-50 hover:border-blue-300"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
