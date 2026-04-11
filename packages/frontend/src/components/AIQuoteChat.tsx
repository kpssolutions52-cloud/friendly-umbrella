'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Send, X, Loader2, Zap, Package, DollarSign, Building2, Tag, Check, AlertCircle } from 'lucide-react';
import { ProductCard } from './ProductCard';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PriceExpiryInput as PriceExpiryInputComponent, type PriceExpiryInput } from './PriceExpiryInput';

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

interface AIQuoteChatProps {
  onClose: () => void;
}

export function AIQuoteChat({ onClose }: AIQuoteChatProps) {
  const { user } = useAuth();
  const isSupplier = user?.tenant?.type === 'supplier' || user?.type === 'supplier';
  
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
  
  // Special price form state
  const [showSpecialPriceForm, setShowSpecialPriceForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductMatch | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [specialPriceFormData, setSpecialPriceFormData] = useState({
    companyId: '',
    priceType: 'price' as 'price' | 'discount',
    price: '',
    discountPercentage: '',
    currency: 'USD',
    notes: '',
    expiry: undefined as PriceExpiryInput | undefined,
  });
  const [isSubmittingSpecialPrice, setIsSubmittingSpecialPrice] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  // Load companies when form is opened
  useEffect(() => {
    if (showSpecialPriceForm && isSupplier && companies.length === 0) {
      loadCompanies();
    }
  }, [showSpecialPriceForm, isSupplier]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await apiGet<{ companies: Array<{ id: string; name: string; email: string }> }>('/api/v1/companies');
      setCompanies(response.companies || []);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
      toast({
        title: 'Error',
        description: 'Failed to load companies list',
        variant: 'destructive',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSetSpecialPrice = (product: ProductMatch) => {
    if (!isSupplier) return;
    setSelectedProduct(product);
    setShowSpecialPriceForm(true);
    setSpecialPriceFormData({
      companyId: '',
      priceType: 'price',
      price: '',
      discountPercentage: '',
      currency: product.currency || 'USD',
      notes: '',
      expiry: undefined,
    });
  };

  const handleSpecialPriceFormChange = (field: string, value: any) => {
    setSpecialPriceFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitSpecialPrice = async () => {
    if (!selectedProduct) return;

    // Validation
    if (!specialPriceFormData.companyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    if (specialPriceFormData.priceType === 'price') {
      if (!specialPriceFormData.price || parseFloat(specialPriceFormData.price) <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid special price',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!specialPriceFormData.discountPercentage || 
          parseFloat(specialPriceFormData.discountPercentage) < 0 || 
          parseFloat(specialPriceFormData.discountPercentage) > 100) {
        toast({
          title: 'Error',
          description: 'Please enter a valid discount percentage (0-100)',
          variant: 'destructive',
        });
        return;
      }
    }

    // Show confirmation
    setShowConfirmation(true);
  };

  const confirmSpecialPrice = async () => {
    if (!selectedProduct) return;

    setIsSubmittingSpecialPrice(true);
    setShowConfirmation(false);

    try {
      const payload: any = {
        companyId: specialPriceFormData.companyId,
        notes: specialPriceFormData.notes || undefined,
      };

      if (specialPriceFormData.priceType === 'price') {
        payload.price = parseFloat(specialPriceFormData.price);
        payload.currency = specialPriceFormData.currency;
        payload.discountPercentage = undefined;
      } else {
        payload.discountPercentage = parseFloat(specialPriceFormData.discountPercentage);
        payload.price = undefined;
      }

      // Add expiry if provided
      if (specialPriceFormData.expiry) {
        payload.expiry = {
          expiryDuration: specialPriceFormData.expiry.expiryDuration,
          expiryFrom: specialPriceFormData.expiry.expiryFrom 
            ? new Date(specialPriceFormData.expiry.expiryFrom).toISOString() 
            : undefined,
          expiryUntil: specialPriceFormData.expiry.expiryUntil 
            ? new Date(specialPriceFormData.expiry.expiryUntil).toISOString() 
            : undefined,
        };
      }

      await apiPost(`/api/v1/products/${selectedProduct.id}/private-prices`, payload);

      toast({
        title: 'Success',
        description: 'Special price set successfully!',
      });

      // Reset form and close
      setShowSpecialPriceForm(false);
      setSelectedProduct(null);
      setSpecialPriceFormData({
        companyId: '',
        priceType: 'price',
        price: '',
        discountPercentage: '',
        currency: 'USD',
        notes: '',
        expiry: undefined,
      });

      // Add success message to chat
      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Special price has been set successfully for ${selectedProduct.name}!`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error: any) {
      console.error('Failed to set special price:', error);
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to set special price',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingSpecialPrice(false);
    }
  };

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
      // Use apiRequest with custom timeout instead of apiPost
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

  const formatProductForCard = (product: ProductMatch) => {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.categoryName || undefined,
      unit: product.unit,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      supplierLogoUrl: null,
      productImageUrl: null,
      price: product.price,
      priceType: product.priceType,
      currency: product.currency,
      defaultPrice: product.priceType === 'default' && product.price ? {
        price: product.price,
        currency: product.currency || 'USD',
      } : null,
      privatePrice: product.priceType === 'private' && product.price ? {
        price: product.price,
        discountPercentage: null,
        calculatedPrice: product.price,
        currency: product.currency || 'USD',
      } : null,
      type: product.type,
      ratePerHour: null,
      rateType: null,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white shadow-xl w-full h-[100dvh] sm:h-[90vh] sm:max-w-4xl sm:rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white sm:rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold">AI Quote Assistant</h2>
              <p className="text-xs sm:text-sm text-blue-100">Tell me what you need, I&apos;ll find it for you</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <div className="break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className={`mb-2 last:mb-0 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className={`font-semibold ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className={`italic ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {children}
                        </em>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={message.role === 'user' 
                            ? 'text-blue-200 hover:text-blue-100 underline' 
                            : 'text-blue-600 hover:text-blue-800 underline'
                          }
                        >
                          {children}
                        </a>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        if (isInline) {
                          return (
                            <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                              message.role === 'user' 
                                ? 'bg-white/20 text-white' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code className={className}>
                            <pre className={`p-3 rounded-lg overflow-x-auto mb-2 text-xs ${
                              message.role === 'user'
                                ? 'bg-white/10 text-white'
                                : 'bg-gray-900 text-gray-100'
                            }`}>
                              {children}
                            </pre>
                          </code>
                        );
                      },
                      ul: ({ children }) => (
                        <ul className={`list-disc ml-4 mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className={`list-decimal ml-4 mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className={`mb-1 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {children}
                        </li>
                      ),
                      h1: ({ children }) => (
                        <h1 className={`text-xl font-bold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className={`text-lg font-semibold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className={`text-base font-semibold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className={`border-l-4 pl-3 italic my-2 ${
                          message.role === 'user' 
                            ? 'border-white/30 text-white/90' 
                            : 'border-gray-300 text-gray-700'
                        }`}>
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
                {/* Reasoning (if available) */}
                {message.reasoning && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">Why these results?</p>
                    <div className="text-sm text-gray-600 break-words">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.reasoning}
                      </ReactMarkdown>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] sm:max-h-96 overflow-y-auto">
                      {message.products.map((product) => (
                        <div key={product.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-900">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{product.supplierName}</p>
                            </div>
                            {product.price !== null && product.price !== undefined && (
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
                          {isSupplier && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetSpecialPrice(product)}
                                className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                Set Special Price
                              </Button>
                            </div>
                          )}
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
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Searching for products...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Special Price Form Modal */}
        {showSpecialPriceForm && selectedProduct && (
            <div className="absolute inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Set Special Price</h2>
                    <p className="text-sm text-gray-600 mt-1">For: {selectedProduct.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSpecialPriceForm(false);
                      setSelectedProduct(null);
                      setShowConfirmation(false);
                    }}
                    disabled={isSubmittingSpecialPrice}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmitSpecialPrice(); }} className="space-y-4">
                  {/* Question 1: Company Selection */}
                  <div>
                    <Label htmlFor="company-select" className="text-base font-semibold">
                      1. Which company should receive this special price? *
                    </Label>
                    <select
                      id="company-select"
                      value={specialPriceFormData.companyId}
                      onChange={(e) => handleSpecialPriceFormChange('companyId', e.target.value)}
                      disabled={isSubmittingSpecialPrice || loadingCompanies}
                      required
                      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a company...</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {loadingCompanies && (
                      <p className="text-xs text-gray-500 mt-1">Loading companies...</p>
                    )}
                  </div>

                  {/* Question 2: Price Type */}
                  <div>
                    <Label className="text-base font-semibold">
                      2. What type of special pricing? *
                    </Label>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant={specialPriceFormData.priceType === 'price' ? 'default' : 'outline'}
                        onClick={() => {
                          handleSpecialPriceFormChange('priceType', 'price');
                          handleSpecialPriceFormChange('discountPercentage', '');
                        }}
                        disabled={isSubmittingSpecialPrice}
                        className="flex-1"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Special Price
                      </Button>
                      <Button
                        type="button"
                        variant={specialPriceFormData.priceType === 'discount' ? 'default' : 'outline'}
                        onClick={() => {
                          handleSpecialPriceFormChange('priceType', 'discount');
                          handleSpecialPriceFormChange('price', '');
                        }}
                        disabled={isSubmittingSpecialPrice}
                        className="flex-1"
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        Discount %
                      </Button>
                    </div>
                  </div>

                  {/* Question 3: Price or Discount Value */}
                  {specialPriceFormData.priceType === 'price' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="special-price" className="text-base font-semibold">
                          3. What is the special price? *
                        </Label>
                        <Input
                          id="special-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={specialPriceFormData.price}
                          onChange={(e) => handleSpecialPriceFormChange('price', e.target.value)}
                          disabled={isSubmittingSpecialPrice}
                          placeholder="0.00"
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency-select" className="text-base font-semibold">
                          Currency *
                        </Label>
                        <select
                          id="currency-select"
                          value={specialPriceFormData.currency}
                          onChange={(e) => handleSpecialPriceFormChange('currency', e.target.value)}
                          disabled={isSubmittingSpecialPrice}
                          required
                          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="SGD">SGD</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="discount-percentage" className="text-base font-semibold">
                        3. What discount percentage? *
                      </Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          id="discount-percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={specialPriceFormData.discountPercentage}
                          onChange={(e) => handleSpecialPriceFormChange('discountPercentage', e.target.value)}
                          disabled={isSubmittingSpecialPrice}
                          placeholder="0.00"
                          required
                          className="flex-1 max-w-xs"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Discount will be calculated from the default price ({selectedProduct.currency || 'USD'})
                      </p>
                    </div>
                  )}

                  {/* Question 4: Price Expiry (Optional) */}
                  <div>
                    <Label className="text-base font-semibold">
                      4. When should this price expire? (Optional)
                    </Label>
                    <div className="mt-2">
                      <PriceExpiryInputComponent
                        value={specialPriceFormData.expiry}
                        onChange={(expiry) => handleSpecialPriceFormChange('expiry', expiry)}
                        effectiveFrom={new Date()}
                      />
                    </div>
                  </div>

                  {/* Question 5: Notes (Optional) */}
                  <div>
                    <Label htmlFor="notes" className="text-base font-semibold">
                      5. Additional notes (Optional)
                    </Label>
                    <Input
                      id="notes"
                      type="text"
                      value={specialPriceFormData.notes}
                      onChange={(e) => handleSpecialPriceFormChange('notes', e.target.value)}
                      disabled={isSubmittingSpecialPrice}
                      placeholder="Any additional information about this special price..."
                      className="mt-2"
                    />
                  </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowSpecialPriceForm(false);
                        setSelectedProduct(null);
                        setShowConfirmation(false);
                      }}
                      disabled={isSubmittingSpecialPrice}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingSpecialPrice}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmittingSpecialPrice ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Setting...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Set Special Price
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && selectedProduct && (
          <div className="absolute inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Confirm Special Price</h2>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Product:</p>
                  <p className="text-base font-semibold text-gray-900">{selectedProduct.name}</p>
                  
                  <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Company:</p>
                  <p className="text-base font-semibold text-gray-900">
                    {companies.find(c => c.id === specialPriceFormData.companyId)?.name || 'Unknown'}
                  </p>
                  
                  <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Pricing:</p>
                  <p className="text-base font-semibold text-gray-900">
                    {specialPriceFormData.priceType === 'price' 
                      ? `${specialPriceFormData.currency} ${parseFloat(specialPriceFormData.price || '0').toFixed(2)}`
                      : `${specialPriceFormData.discountPercentage}% discount`
                    }
                  </p>
                  
                  {specialPriceFormData.expiry && (
                    <>
                      <p className="text-sm font-medium text-gray-700 mt-3 mb-2">Expiry:</p>
                      <p className="text-base text-gray-900">
                        {specialPriceFormData.expiry.expiryUntil 
                          ? new Date(specialPriceFormData.expiry.expiryUntil).toLocaleDateString()
                          : '1 year (default)'
                        }
                      </p>
                    </>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to set this special price? This action will create a custom price for the selected company.
                </p>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    disabled={isSubmittingSpecialPrice}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={confirmSpecialPrice}
                    disabled={isSubmittingSpecialPrice}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingSpecialPrice ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm & Set
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-gray-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you're looking for..."
              disabled={isLoading}
              className="flex-1"
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ask me anything about products or services you need for your project
          </p>
        </form>
      </div>
    </div>
  );
}
