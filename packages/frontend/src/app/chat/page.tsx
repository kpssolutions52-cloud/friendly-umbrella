'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiPost, apiGet } from '@/lib/api';
import {
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Building2,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  X,
  Plus,
  Loader2 as LoaderIcon,
  Zap,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProcurementPanel } from '@/components/procurement/ProcurementPanel';
import { ProcurementRequestCard } from '@/components/procurement/ProcurementRequestCard';
import { SupplierIntelligenceHub } from '@/components/supplier-hub/SupplierIntelligenceHub';
import { createProcurementRequest, listProcurementRequests } from '@/lib/procurementApi';
import type { ProcurementRequest } from '@/lib/procurementApi';
import { useChatSplitPercent, useMinMd } from '@/hooks/useChatSplitPercent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  requiresPermission?: boolean;
  hasSystemData?: boolean;
  systemDataSummary?: string;
  isProcurementIntent?: boolean;
  procurementPrompt?: string;
}

type PanelMode = 'split' | 'chat-full' | 'dashboard-full';
type RightPanelTab = 'products' | 'rfqs' | 'hub';

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('split');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const { chatSplitPercent, setChatSplitPercent } = useChatSplitPercent('cg-qs-chat-split-pct');
  const isMd = useMinMd();
  
  // Right panel: Products vs RFQs
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('products');

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(1);

  // Procurement (RFQs tab)
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [isLoadingProcurement, setIsLoadingProcurement] = useState(false);
  const [newRfqPrompt, setNewRfqPrompt] = useState('');
  const [isCreatingRfq, setIsCreatingRfq] = useState(false);
  const [lastDiscoveryMeta, setLastDiscoveryMeta] = useState<{
    webSearchEnabled: boolean;
    webSearchQuery?: string;
    internalCount: number;
    webCount: number;
  } | null>(null);

  const [activeProcurementRequest, setActiveProcurementRequest] = useState<ProcurementRequest | null>(null);
  const [startingRfq, setStartingRfq] = useState<string | null>(null); // tracks which message is starting RFQ

  // Redirect if not authenticated or not QS
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // If user is supplier, redirect to supplier chat
    if (user?.type === 'supplier' || user?.tenant?.type === 'supplier') {
      router.push('/supplier/chat');
      return;
    }
    // If user is not QS, redirect to home
    if (user?.type !== 'qs') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  const loadProcurementRequests = useCallback(async () => {
    setIsLoadingProcurement(true);
    try {
      const res = await listProcurementRequests();
      setProcurementRequests(res.requests);
    } catch (e) {
      console.error('Failed to load procurement requests:', e);
    } finally {
      setIsLoadingProcurement(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.type === 'qs') {
      loadProcurementRequests();
    }
  }, [isAuthenticated, user, loadProcurementRequests]);

  const showAvailableActions = () => {
    const actionsMessage: Message = {
      role: 'assistant',
      content: `## Available Actions

### Product & Pricing:
- **Get Product Price** - Retrieve price details for a specific product
  *Example: "What is the price of cement?"*

- **Calculate Total Price** - Calculate the total cost for a specific quantity
  *Example: "Calculate total for 10 bags of cement"*

- **List Products** - List all products in the inventory
  *Example: "Show me all available products"*

- **Calculate Multi Product Total** - Calculate total price for multiple products with different quantities
  *Example: "Calculate total for 10 bags cement and 5 gallons paint"*

### Project Management:
- **Create Project** - Create a new construction project
  *Example: "Create a project called Office Building"*

- **Request Quote** - Request quotes for project materials
  *Example: "Request quotes for Office Building project"*

- **View Projects** - View all your projects
  *Example: "Show me all my projects"*

### General:
- **Search Suppliers** - Find suppliers for specific products or services
  *Example: "Find suppliers for concrete"*

- **Compare Prices** - Compare prices from different suppliers
  *Example: "Compare cement prices from all suppliers"*`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, actionsMessage]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load products
  const loadProducts = useCallback(async (page = 1, search = '') => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('q', search);
      }
      params.append('page', page.toString());
      params.append('limit', '12'); // Show 12 products in dashboard

      const response = await apiGet<{ 
        products: any[]; 
        pagination: { page: number; totalPages: number; total: number } 
      }>(`/api/v1/products/search?${params.toString()}`);
      
      console.log('[Products] Loaded products:', response.products?.length || 0, 'products');
      setProducts(response.products || []);
      setCurrentProductPage(response.pagination.page);
      setTotalProductPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    if (isAuthenticated && user?.type === 'qs') {
      loadProducts(1, '');
    }
  }, [isAuthenticated, user, loadProducts]);

  // Detect if a message looks like a procurement/sourcing request
  const isProcurementMessage = (text: string): boolean => {
    const lower = text.toLowerCase();
    return /\b(find\s+(me\s+)?\d*\s*suppliers?|source|rfq|request\s+for\s+quotation|get\s+quotes?|procure|vendors?\s+for|suppliers?\s+for|ready.mix|concrete\s+supplier|steel\s+supplier|find.*supplier|looking\s+for\s+supplier)\b/.test(lower);
  };

  const handleStartRfq = async (prompt: string, messageIndex: number) => {
    setStartingRfq(`${messageIndex}`);
    try {
      const result = await createProcurementRequest(prompt);
      setActiveProcurementRequest(result.request);
      setLastDiscoveryMeta(result.discovery ?? null);
      setRightPanelTab('rfqs');
      setProcurementRequests((prev) => [result.request, ...prev]);
      if (panelMode === 'chat-full') setPanelMode('split');
    } catch (err: any) {
      console.error('Failed to start RFQ:', err);
    } finally {
      setStartingRfq(null);
    }
  };

  const handleCreateRfqFromPanel = async () => {
    if (!newRfqPrompt.trim()) return;
    setIsCreatingRfq(true);
    try {
      const result = await createProcurementRequest(newRfqPrompt.trim());
      setProcurementRequests((prev) => [result.request, ...prev]);
      setActiveProcurementRequest(result.request);
      setLastDiscoveryMeta(result.discovery ?? null);
      setNewRfqPrompt('');
      if (panelMode === 'chat-full') setPanelMode('split');
    } catch (err) {
      console.error('Failed to create RFQ:', err);
    } finally {
      setIsCreatingRfq(false);
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

    const questionText = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await apiPost<{ 
        answer: string; 
        requiresPermission?: boolean;
        hasSystemData?: boolean;
        systemDataSummary?: string;
      }>('/api/v1/chat', {
        question: questionText,
        allowGenericAnswers: false,
        conversationHistory: conversationHistory,
      });

      const isProcurement = isProcurementMessage(questionText);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        requiresPermission: response.requiresPermission,
        hasSystemData: response.hasSystemData,
        systemDataSummary: response.systemDataSummary,
        isProcurementIntent: isProcurement,
        procurementPrompt: isProcurement ? questionText : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error?.error?.message || 'Failed to get response. Please try again.'}`,
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

  const togglePanelMode = (mode: PanelMode) => {
    setPanelMode(mode);
  };

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (panelMode !== 'split' || !isMd) return;
      const startX = e.clientX;
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      if (w <= 0) return;
      const startPct = chatSplitPercent;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        setChatSplitPercent(startPct + (dx / w) * 100);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [panelMode, isMd, chatSplitPercent, setChatSplitPercent]
  );

  if (!isAuthenticated || user?.type !== 'qs') {
    return null; // Will redirect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      {/* Split Layout — chat width adjustable on desktop (drag handle); hide chat = dashboard-only */}
      <div ref={splitContainerRef} className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* Left Panel - Chat */}
        <div
          className={`bg-white border-r border-gray-200 flex flex-col transition-[width] duration-300 min-h-0 ${
            panelMode === 'dashboard-full' ? 'w-0 hidden' : 
            panelMode === 'chat-full' ? 'w-full' : 
            'w-full min-w-0 md:min-w-[240px] md:max-w-[80%]'
          }`}
          style={
            panelMode === 'split' && isMd
              ? { width: `${chatSplitPercent}%`, flexShrink: 0 as const }
              : undefined
          }
        >
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                QS AI Assistant
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Ask about pricing and materials
                <span className="hidden md:inline"> · Drag the divider to resize, or ◀ to hide chat</span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              {panelMode === 'split' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('chat-full')}
                  title="Maximize chat"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {panelMode === 'chat-full' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                  title="Split view"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePanelMode('dashboard-full')}
                title="Focus on dashboard (hide chat)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-2xl mb-3">👋</div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Welcome to QS AI Assistant
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Try asking:
                </p>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  <div className="bg-blue-50 p-2 rounded text-xs text-gray-700">
                    "What's the price of cement?"
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-xs text-gray-700">
                    "Show me prices for cement, steel, and sand"
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-xs text-gray-700">
                    "How much does 100 bags of cement cost?"
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
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
                                  : 'bg-gray-200 text-gray-800'
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
                          <h1 className={`text-lg font-bold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className={`text-base font-semibold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className={`text-sm font-semibold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
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
                  
                  {/* Permission request UI */}
                  {message.requiresPermission && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            // Resend the last user question with permission
                            const lastUserMessage = messages
                              .filter((m) => m.role === 'user')
                              .slice(-1)[0];
                            
                            if (lastUserMessage) {
                              try {
                                const response = await apiPost<{ 
                                  answer: string; 
                                  requiresPermission?: boolean;
                                  hasSystemData?: boolean;
                                  systemDataSummary?: string;
                                }>('/api/v1/chat', {
                                  question: lastUserMessage.content,
                                  allowGenericAnswers: true,
                                });

                                const permissionMessage: Message = {
                                  role: 'assistant',
                                  content: response.answer,
                                  timestamp: new Date().toISOString(),
                                  requiresPermission: false,
                                  hasSystemData: response.hasSystemData,
                                  systemDataSummary: response.systemDataSummary,
                                };

                                setMessages((prev) => [...prev, permissionMessage]);
                              } catch (error: any) {
                                const errorMessage: Message = {
                                  role: 'assistant',
                                  content: `Error: ${error?.error?.message || 'Failed to get response. Please try again.'}`,
                                  timestamp: new Date().toISOString(),
                                };
                                setMessages((prev) => [...prev, errorMessage]);
                              }
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          Yes, provide general information
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const infoMessage: Message = {
                              role: 'assistant',
                              content: 'Understood. I\'ll only provide information from the system database. Please ask about suppliers or products that are in the system.',
                              timestamp: new Date().toISOString(),
                            };
                            setMessages((prev) => [...prev, infoMessage]);
                          }}
                          className="text-xs"
                        >
                          No, system data only
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* System data indicator */}
                  {message.hasSystemData !== undefined && (
                    <div className={`text-xs mt-2 ${
                      message.hasSystemData ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {message.hasSystemData ? '✓ Using system database data' : '⚠ No system data found'}
                    </div>
                  )}

                  {/* Procurement intent action card */}
                  {message.isProcurementIntent && message.procurementPrompt && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          Procurement Agent Available
                        </p>
                        <p className="text-xs text-blue-700 mb-2">
                          I can automate this RFQ — find suppliers, generate a quote request, and send it via email or WhatsApp.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleStartRfq(message.procurementPrompt!, index)}
                          disabled={startingRfq === `${index}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                        >
                          {startingRfq === `${index}` ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-3 h-3 mr-1" />
                          )}
                          {startingRfq === `${index}` ? 'Starting RFQ...' : 'Start RFQ Process'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-blue-100'
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
                    <span className="text-gray-500 text-xs">Thinking...</span>
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
                  onClick={showAvailableActions}
                  disabled={loading}
                  className="text-xs h-7 px-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Actions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput('Find me 5 suppliers in Singapore for ')}
                  disabled={loading}
                  className="text-xs h-7 px-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Start RFQ
                </Button>
              </div>
            </div>
            
            <div className="px-3 py-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  disabled={loading}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  size="sm"
                  className="px-3"
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

        {panelMode === 'split' && isMd && (
          <button
            type="button"
            aria-label="Drag to resize chat and dashboard"
            title="Drag to resize panels"
            onMouseDown={onResizeStart}
            className="group w-2 shrink-0 cursor-col-resize flex flex-col items-center justify-center border-x border-gray-200/80 bg-gray-100 hover:bg-blue-100/60 transition-colors"
          >
            <GripVertical className="h-10 w-4 text-gray-400 group-hover:text-blue-600" />
          </button>
        )}

        <div className="flex-1 flex flex-row min-w-0 overflow-hidden">
        {/* Procurement Panel - slides in from right when active */}
        {activeProcurementRequest && (
          <div className="w-full md:w-[380px] flex-shrink-0 flex flex-col overflow-hidden border-l border-gray-200">
            <ProcurementPanel
              request={activeProcurementRequest}
              onClose={() => setActiveProcurementRequest(null)}
              onUpdate={(updated) => {
                setActiveProcurementRequest(updated);
                setProcurementRequests((prev) =>
                  prev.map((r) => (r.id === updated.id ? updated : r))
                );
              }}
            />
          </div>
        )}

        {/* Right Panel - Dashboard */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-gray-50 transition-all duration-300 min-w-0 ${
            panelMode === 'chat-full' ? 'w-0 hidden' : activeProcurementRequest ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Dashboard Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {panelMode === 'dashboard-full' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                  title="Show chat panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  QS Dashboard
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Products, RFQs &amp; supplier intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {panelMode === 'split' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('dashboard-full')}
                  title="Maximize dashboard"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {panelMode === 'dashboard-full' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                  title="Split view"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Dashboard Content — Products, RFQs & Supplier Hub */}
          <div
            className={`flex-1 p-4 flex flex-col min-h-0 ${
              rightPanelTab === 'hub' ? 'overflow-hidden' : 'overflow-y-auto'
            }`}
          >
            <div className="flex border-b border-gray-200 mb-4 flex-shrink-0 overflow-x-auto gap-0.5">
              <button
                type="button"
                onClick={() => setRightPanelTab('products')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  rightPanelTab === 'products'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => {
                  setRightPanelTab('rfqs');
                  loadProcurementRequests();
                }}
                className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  rightPanelTab === 'rfqs'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                RFQs
                {procurementRequests.length > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      rightPanelTab === 'rfqs' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {procurementRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('hub')}
                className={`px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  rightPanelTab === 'hub'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Supplier Intelligence Hub — directory, Excel import & export"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                Suppliers
              </button>
            </div>

            {rightPanelTab === 'products' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-1 min-h-0 flex flex-col">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" />
                  Products
                </h2>
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadProducts(1, productSearchQuery);
                        }
                      }}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No products found</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-3 max-h-[min(400px,50vh)] overflow-y-auto flex-1">
                      {products.slice(0, 12).map((product: any) => (
                        <div
                          key={`${product.id}-${product.supplierId || ''}`}
                          onClick={() => console.log('View product:', product.id)}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate">{product.supplierName}</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {product.defaultPrice
                                ? `${product.defaultPrice.currency || product.currency || 'USD'} ${Number(product.defaultPrice.price).toFixed(2)}`
                                : product.price != null
                                  ? `${product.currency || 'USD'} ${Number(product.price).toFixed(2)}`
                                  : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">{product.unit}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalProductPages > 1 && (
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                        <span>
                          Page {currentProductPage} of {totalProductPages}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadProducts(currentProductPage - 1, productSearchQuery)}
                            disabled={currentProductPage === 1}
                            className="h-6 px-2 text-xs"
                          >
                            Prev
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadProducts(currentProductPage + 1, productSearchQuery)}
                            disabled={currentProductPage === totalProductPages}
                            className="h-6 px-2 text-xs"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Link href="/company/dashboard">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Open full catalog
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}

            {rightPanelTab === 'rfqs' && (
              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    New RFQ
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Describe what you need. We find suppliers and draft an RFQ you can send by email or WhatsApp.
                  </p>
                  <textarea
                    value={newRfqPrompt}
                    onChange={(e) => setNewRfqPrompt(e.target.value)}
                    rows={3}
                    placeholder='e.g. "Find 5 suppliers in Singapore for ready-mix concrete"'
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <Button
                    onClick={handleCreateRfqFromPanel}
                    disabled={isCreatingRfq || !newRfqPrompt.trim()}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isCreatingRfq ? (
                      <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {isCreatingRfq ? 'Creating…' : 'Start RFQ'}
                  </Button>
                </div>

                {lastDiscoveryMeta && (
                  <div
                    className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-2 ${
                      lastDiscoveryMeta.webSearchEnabled
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <span className="mt-0.5">{lastDiscoveryMeta.webSearchEnabled ? '🌐' : '⚠️'}</span>
                    <div className="flex-1">
                      <p className="font-medium">
                        {lastDiscoveryMeta.webSearchEnabled
                          ? `Found ${lastDiscoveryMeta.internalCount} internal + ${lastDiscoveryMeta.webCount} web suppliers`
                          : `Found ${lastDiscoveryMeta.internalCount} internal suppliers (web search not configured)`}
                      </p>
                      {lastDiscoveryMeta.webSearchQuery && (
                        <p className="opacity-75 mt-0.5">Query: {lastDiscoveryMeta.webSearchQuery}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLastDiscoveryMeta(null)}
                      className="text-current opacity-50 hover:opacity-100"
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {isLoadingProcurement ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : procurementRequests.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No RFQs yet.</p>
                    <p className="text-xs mt-1">Create one above or use &quot;Start RFQ&quot; in chat.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {procurementRequests.map((req) => (
                      <ProcurementRequestCard
                        key={req.id}
                        request={req}
                        onClick={() => {
                          setActiveProcurementRequest(req);
                          if (panelMode === 'chat-full') setPanelMode('split');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {rightPanelTab === 'hub' && (
              <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <SupplierIntelligenceHub />
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
