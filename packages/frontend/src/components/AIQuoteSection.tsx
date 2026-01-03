'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Zap, Package, TrendingUp, DollarSign, Lightbulb, AlertTriangle, Building2, BarChart3, ExternalLink, Phone, Mail, MapPin } from 'lucide-react';

interface ProjectInsights {
  projectType?: string;
  estimatedScope?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  timeline?: string;
  budgetConsiderations?: string[];
  requiredExpertise?: string[];
}

interface CostEstimate {
  estimatedRange?: {
    min: number;
    max: number;
    currency: string;
    confidence: 'low' | 'medium' | 'high';
  };
  costBreakdown?: Array<{
    category: string;
    estimatedCost: number;
    currency: string;
    notes?: string;
  }>;
  costSavingTips?: string[];
}

interface MarketInsights {
  priceTrends?: string;
  supplierRecommendations?: string;
  marketAvailability?: string;
  qualityConsiderations?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: ProductMatch[];
  summary?: string;
  reasoning?: string;
  suggestions?: string[];
  projectInsights?: ProjectInsights;
  costEstimate?: CostEstimate;
  marketInsights?: MarketInsights;
  bestPractices?: string[];
  riskConsiderations?: string[];
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
  supplierEmail?: string | null;
  supplierPhone?: string | null;
  supplierAddress?: string | null;
  supplierLogoUrl?: string | null;
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
  projectInsights?: ProjectInsights;
  costEstimate?: CostEstimate;
  marketInsights?: MarketInsights;
  bestPractices?: string[];
  riskConsiderations?: string[];
}

export function AIQuoteSection() {
  const router = useRouter();
  const { user } = useAuth();
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
        projectInsights: response.data.projectInsights,
        costEstimate: response.data.costEstimate,
        marketInsights: response.data.marketInsights,
        bestPractices: response.data.bestPractices,
        riskConsiderations: response.data.riskConsiderations,
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                    {message.products.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                        {/* Product Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base text-gray-900 mb-1 line-clamp-2">{product.name}</h4>
                            <p className="text-xs text-gray-500 mb-1">SKU: {product.sku}</p>
                            {product.description && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-3">{product.description}</p>
                            )}
                          </div>
                          {product.price !== null && product.price !== undefined && (
                            <div className="text-right ml-3 flex-shrink-0">
                              <div className="text-lg font-bold text-green-600">
                                {product.currency} {product.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">{product.unit}</div>
                              {product.priceType === 'private' && (
                                <span className="text-xs text-green-600 font-medium">Special Price</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Category & Type Tags */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {product.categoryName && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {product.categoryName}
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                            {product.type === 'product' ? 'Product' : 'Service'}
                          </span>
                        </div>

                        {/* Supplier Information */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            {product.supplierLogoUrl ? (
                              <img 
                                src={product.supplierLogoUrl} 
                                alt={product.supplierName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-semibold text-blue-600">
                                  {product.supplierName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <p className="text-sm font-medium text-gray-900">{product.supplierName}</p>
                          </div>
                          
                          {/* Supplier Contact Info */}
                          <div className="space-y-1 text-xs text-gray-600">
                            {product.supplierPhone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <a 
                                  href={`tel:${product.supplierPhone}`}
                                  className="hover:text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {product.supplierPhone}
                                </a>
                              </div>
                            )}
                            {product.supplierEmail && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <a 
                                  href={`mailto:${product.supplierEmail}`}
                                  className="hover:text-blue-600 hover:underline truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {product.supplierEmail}
                                </a>
                              </div>
                            )}
                            {product.supplierAddress && (
                              <div className="flex items-start gap-1.5">
                                <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{product.supplierAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                          onClick={() => {
                            if (user) {
                              router.push(`/products/${product.id}`);
                            } else {
                              router.push(`/auth/login?returnUrl=${encodeURIComponent(`/products/${product.id}`)}`);
                            }
                          }}
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Insights */}
              {message.projectInsights && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-700">Project Analysis</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {message.projectInsights.projectType && (
                      <p><span className="font-medium">Project Type:</span> {message.projectInsights.projectType}</p>
                    )}
                    {message.projectInsights.estimatedScope && (
                      <p><span className="font-medium">Scope:</span> {message.projectInsights.estimatedScope}</p>
                    )}
                    {message.projectInsights.complexity && (
                      <p><span className="font-medium">Complexity:</span> 
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                          message.projectInsights.complexity === 'simple' ? 'bg-green-100 text-green-700' :
                          message.projectInsights.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {message.projectInsights.complexity}
                        </span>
                      </p>
                    )}
                    {message.projectInsights.timeline && (
                      <p><span className="font-medium">Timeline:</span> {message.projectInsights.timeline}</p>
                    )}
                    {message.projectInsights.budgetConsiderations && message.projectInsights.budgetConsiderations.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Budget Considerations:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {message.projectInsights.budgetConsiderations.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {message.projectInsights.requiredExpertise && message.projectInsights.requiredExpertise.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Required Expertise:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.projectInsights.requiredExpertise.map((expertise, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {expertise}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cost Estimate */}
              {message.costEstimate && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-semibold text-gray-700">Cost Estimate</p>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    {message.costEstimate.estimatedRange && message.costEstimate.estimatedRange.min !== null && message.costEstimate.estimatedRange.min !== undefined && message.costEstimate.estimatedRange.max !== null && message.costEstimate.estimatedRange.max !== undefined && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="font-medium text-gray-900 mb-1">Estimated Range:</p>
                        <p className="text-lg font-bold text-green-700">
                          {message.costEstimate.estimatedRange.currency} {message.costEstimate.estimatedRange.min.toFixed(2)} - {message.costEstimate.estimatedRange.max.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Confidence: <span className={`font-medium ${
                            message.costEstimate.estimatedRange.confidence === 'high' ? 'text-green-600' :
                            message.costEstimate.estimatedRange.confidence === 'medium' ? 'text-yellow-600' :
                            'text-orange-600'
                          }`}>
                            {message.costEstimate.estimatedRange.confidence}
                          </span>
                        </p>
                      </div>
                    )}
                    {message.costEstimate.costBreakdown && message.costEstimate.costBreakdown.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Cost Breakdown:</p>
                        <div className="space-y-2">
                          {message.costEstimate.costBreakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start bg-gray-50 rounded p-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.category}</p>
                                {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                              </div>
                              <p className="font-semibold text-gray-900 ml-2">
                                {item.currency} {item.estimatedCost !== null && item.estimatedCost !== undefined ? item.estimatedCost.toFixed(2) : 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {message.costEstimate.costSavingTips && message.costEstimate.costSavingTips.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Cost-Saving Tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {message.costEstimate.costSavingTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Market Insights */}
              {message.marketInsights && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-semibold text-gray-700">Market Insights</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {message.marketInsights.priceTrends && (
                      <p><span className="font-medium">Price Trends:</span> {message.marketInsights.priceTrends}</p>
                    )}
                    {message.marketInsights.supplierRecommendations && (
                      <p><span className="font-medium">Supplier Recommendations:</span> {message.marketInsights.supplierRecommendations}</p>
                    )}
                    {message.marketInsights.marketAvailability && (
                      <p><span className="font-medium">Availability:</span> {message.marketInsights.marketAvailability}</p>
                    )}
                    {message.marketInsights.qualityConsiderations && message.marketInsights.qualityConsiderations.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Quality Considerations:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {message.marketInsights.qualityConsiderations.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Best Practices */}
              {message.bestPractices && message.bestPractices.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-semibold text-gray-700">Best Practices</p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {message.bestPractices.map((practice, idx) => (
                      <li key={idx}>{practice}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Considerations */}
              {message.riskConsiderations && message.riskConsiderations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-semibold text-gray-700">Risk Considerations</p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {message.riskConsiderations.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
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
