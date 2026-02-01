'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiPost, apiGet } from '@/lib/api';
import { Send, Loader2, ChevronLeft, ChevronRight, Maximize2, Minimize2, FileText, Building2, DollarSign, MessageSquare, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  requiresPermission?: boolean;
  hasSystemData?: boolean;
  systemDataSummary?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Quote {
  id: string;
  title: string;
  totalAmount: number;
  status: string;
  createdAt: string;
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
  
  // Dashboard state
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

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

  // Load dashboard data
  useEffect(() => {
    if (isAuthenticated && user?.type === 'qs') {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      // Load projects and quotes (if endpoints exist)
      // For MVP 1, we'll show placeholder data or handle gracefully
      try {
        const [projectsRes, quotesRes] = await Promise.all([
          apiGet<{ projects: Project[] }>('/api/v1/projects').catch(() => ({ projects: [] })),
          apiGet<{ quotes: Quote[] }>('/api/v1/quotes').catch(() => ({ quotes: [] })),
        ]);
        setProjects(projectsRes.projects || []);
        setQuotes(quotesRes.quotes || []);
      } catch (error) {
        // Endpoints might not exist yet - that's okay for MVP 1
        setProjects([]);
        setQuotes([]);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setProjects([]);
      setQuotes([]);
    } finally {
      setLoadingDashboard(false);
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
    
    // Add to recent queries
    setRecentQueries((prev) => [input.trim(), ...prev.slice(0, 4)]);
    
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

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        requiresPermission: response.requiresPermission,
        hasSystemData: response.hasSystemData,
        systemDataSummary: response.systemDataSummary,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Refresh dashboard if needed (e.g., if user asked about projects/quotes)
      if (questionText.toLowerCase().includes('project') || questionText.toLowerCase().includes('quote')) {
        setTimeout(() => {
          loadDashboardData();
        }, 1000);
      }
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

  if (!isAuthenticated || user?.type !== 'qs') {
    return null; // Will redirect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
            panelMode === 'dashboard-full' ? 'w-0 hidden' : 
            panelMode === 'chat-full' ? 'w-full' : 
            'w-full md:w-1/3'
          }`}
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
                className="md:hidden"
                title="Hide chat"
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
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
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
          <div className="bg-white border-t border-gray-200 px-3 py-2">
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

        {/* Right Panel - Dashboard */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-gray-50 transition-all duration-300 ${
            panelMode === 'chat-full' ? 'w-0 hidden' : 'flex'
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
                  Projects, quotes & insights
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

          {/* Dashboard Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingDashboard ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Loading dashboard...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Projects</p>
                        <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quotes</p>
                        <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Queries</p>
                        <p className="text-2xl font-bold text-gray-900">{recentQueries.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Button */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <Link href="/company/products">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      <Package className="h-5 w-5 mr-2" />
                      Browse Products
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    View all products across suppliers with search and category filters
                  </p>
                </div>

                {/* Recent Projects */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Recent Projects
                  </h2>
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.slice(0, 5).map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{project.name}</p>
                            <p className="text-xs text-gray-500">
                              {project.status} • {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Quotes */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Recent Quotes
                  </h2>
                  {quotes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No quotes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quotes.slice(0, 5).map((quote) => (
                        <div
                          key={quote.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{quote.title}</p>
                            <p className="text-xs text-gray-500">
                              ${quote.totalAmount.toFixed(2)} • {quote.status} • {new Date(quote.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Queries */}
                {recentQueries.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Recent Queries
                    </h2>
                    <div className="space-y-2">
                      {recentQueries.map((query, index) => (
                        <div
                          key={index}
                          className="p-2 bg-blue-50 rounded text-xs text-gray-700 border border-blue-100"
                        >
                          "{query}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
