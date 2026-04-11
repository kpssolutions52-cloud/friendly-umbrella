'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import {
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Zap,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';

/** OpenAI + Supplier Hub context can exceed the default api client timeout (10s). */
const QS_CHAT_API_TIMEOUT_MS = 180_000;

function chatErrorText(error: unknown): string {
  const e = error as { error?: { message?: string }; message?: string };
  return e?.error?.message || e?.message || 'Failed to get response. Please try again.';
}
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SupplierIntelligenceHub } from '@/components/supplier-hub/SupplierIntelligenceHub';
import { useChatSplitPercent, useMinMd } from '@/hooks/useChatSplitPercent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  requiresPermission?: boolean;
  hasSystemData?: boolean;
  systemDataSummary?: string;
}

type PanelMode = 'split' | 'chat-full' | 'dashboard-full';

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

  const isMobile = !isMd;

  /** `useMinMd` is false until after mount; never map desktop `split` → `chat-full` in state (that stuck full-width chat). */
  const effectivePanelMode: PanelMode = useMemo(() => {
    if (!isMd) {
      if (panelMode === 'dashboard-full') return 'dashboard-full';
      return 'chat-full';
    }
    return panelMode;
  }, [isMd, panelMode]);

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

  const showAvailableActions = () => {
    const actionsMessage: Message = {
      role: 'assistant',
      content: `## Available Actions

### Supplier Hub:
- **List suppliers** - Show all suppliers from your organization hub
  *Example: "List all suppliers in my supplier hub"*

- **Find by trade/category** - Search suppliers by specialty
  *Example: "Find suppliers with trade glass"*

- **Get contact details** - Retrieve phone/email/contact names
  *Example: "Show contact details for Peck Tiong"*

- **Search by remarks** - Match remarks imported from Excel
  *Example: "Show suppliers where remarks mention preferred"*`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, actionsMessage]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


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
      }>(
        '/api/v1/chat',
        {
          question: questionText,
          allowGenericAnswers: false,
          conversationHistory: conversationHistory,
        },
        true,
        QS_CHAT_API_TIMEOUT_MS
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        requiresPermission: response.requiresPermission,
        hasSystemData: response.hasSystemData,
        systemDataSummary: response.systemDataSummary,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${chatErrorText(error)}`,
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
      if (effectivePanelMode !== 'split' || !isMd) return;
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
    [effectivePanelMode, isMd, chatSplitPercent, setChatSplitPercent]
  );

  if (!isAuthenticated || user?.type !== 'qs') {
    return null; // Will redirect
  }

  const showChatPanel = effectivePanelMode !== 'dashboard-full';
  const showDashboardPanel = effectivePanelMode !== 'chat-full';

  return (
    <div className="flex h-[100dvh] flex-col bg-gradient-to-b from-slate-50 to-white">
      <Header />

      {isMobile && (
        <div className="border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => togglePanelMode('chat-full')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                panelMode !== 'dashboard-full'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              AI Chat
            </button>
            <button
              type="button"
              onClick={() => togglePanelMode('dashboard-full')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                panelMode === 'dashboard-full'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              QS Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Split Layout — chat width adjustable on desktop (drag handle); hide chat = dashboard-only */}
      <div
        ref={splitContainerRef}
        className={`flex-1 min-h-0 overflow-hidden ${isMd ? 'flex flex-row' : 'flex flex-col'}`}
      >
        {/* Left Panel - Chat */}
        <div
          className={`bg-white border-r border-gray-200 flex-col transition-[width] duration-300 min-h-0 ${
            showChatPanel ? 'flex' : 'hidden'
          } ${
            isMd
              ? effectivePanelMode === 'chat-full'
                ? 'w-full'
                : 'w-full min-w-0 md:min-w-[240px] md:max-w-[80%]'
              : 'w-full flex-1'
          }`}
          style={
            effectivePanelMode === 'split' && isMd
              ? { width: `${chatSplitPercent}%`, flexShrink: 0 as const }
              : undefined
          }
        >
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-4 flex items-center justify-between">
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
              {effectivePanelMode === 'split' && isMd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('chat-full')}
                  title="Maximize chat"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {effectivePanelMode === 'chat-full' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                  title="Split view"
                  className={isMd ? '' : 'hidden'}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              {isMd ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('dashboard-full')}
                  title="Focus on dashboard (hide chat)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('dashboard-full')}
                  title="Open dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3">
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
                                }>(
                                  '/api/v1/chat',
                                  {
                                    question: lastUserMessage.content,
                                    allowGenericAnswers: true,
                                  },
                                  true,
                                  QS_CHAT_API_TIMEOUT_MS
                                );

                                const permissionMessage: Message = {
                                  role: 'assistant',
                                  content: response.answer,
                                  timestamp: new Date().toISOString(),
                                  requiresPermission: false,
                                  hasSystemData: response.hasSystemData,
                                  systemDataSummary: response.systemDataSummary,
                                };

                                setMessages((prev) => [...prev, permissionMessage]);
                              } catch (error: unknown) {
                                const errorMessage: Message = {
                                  role: 'assistant',
                                  content: `Error: ${chatErrorText(error)}`,
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
                              content: 'Understood. I\'ll only provide information from the system database. Please ask about suppliers that are in the system.',
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
          <div className="bg-white border-t border-gray-200 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
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
                  onClick={() => setInput('List all suppliers in my supplier hub')}
                  disabled={loading}
                  className="text-xs h-7 px-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Supplier Hub
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

        <div className={`flex-1 min-w-0 overflow-hidden ${isMd ? 'flex flex-row' : 'flex flex-col'}`}>
        {/* Right Panel - Dashboard */}
        <div
          className={`flex-1 flex-col overflow-hidden bg-gray-50 transition-all duration-300 min-w-0 ${
            showDashboardPanel ? 'flex' : 'hidden'
          } ${
            !isMd ? 'w-full' : ''
          }`}
        >
          {/* Dashboard Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {effectivePanelMode === 'dashboard-full' && isMd && (
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
                <p className="hidden text-xs text-gray-500 mt-0.5 sm:block">Supplier intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {effectivePanelMode === 'split' && isMd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('dashboard-full')}
                  title="Maximize dashboard"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {effectivePanelMode === 'dashboard-full' && isMd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                  title="Split view"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              {!isMd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('chat-full')}
                  title="Back to chat"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Dashboard Content — Supplier Hub */}
          <div className="flex-1 px-4 pt-1 pb-2 sm:px-6 sm:py-4 sm:pt-4 sm:pb-3 flex flex-col min-h-0 overflow-hidden">
            <div className="flex border-b border-gray-200 mb-1 sm:mb-4 flex-shrink-0 overflow-x-auto gap-0.5">
              <button
                type="button"
                className="px-2 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap border-b-2 border-blue-600 text-blue-600"
                title="Suppliers"
                aria-label="Suppliers"
              >
                <Building2 className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Suppliers</span>
              </button>
            </div>
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              <SupplierIntelligenceHub />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
