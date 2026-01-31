'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Menu, X, TrendingUp, Users, Zap, Target, FileText, Code, BarChart3, Rocket, Building2, ShoppingCart, Home } from 'lucide-react';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (sidebarOpen && !target.closest('.docs-sidebar') && !target.closest('.docs-menu-button')) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      {/* Fixed Top Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center flex-1 min-w-0">
              {/* Mobile menu button */}
              <button
                className="docs-menu-button mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md lg:hidden touch-target"
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(!sidebarOpen);
                }}
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity flex-shrink-0">
                {/* Logo */}
                <div className="relative h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                  <Logo
                    src="/images/logo.jpg"
                    alt="QS AI Agent"
                    width={32}
                    height={32}
                    priority
                    unoptimized
                  />
                </div>
                {/* Company Name */}
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    ConstructionGuru
                  </div>
                  <div className="hidden xs:block text-xs font-semibold text-gray-700 -mt-0.5 truncate">
                    Documentation
                  </div>
                </div>
              </Link>

              {/* Desktop navigation */}
              <div className="hidden lg:flex ml-8 space-x-8">
                <Link
                  href="/docs"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500"
                >
                  Documentation
                </Link>
              </div>
            </div>

            {/* Back to App button */}
            <div className="flex items-center flex-shrink-0 ml-2">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Hidden on mobile, shown as drawer */}
        <aside className={`
          docs-sidebar
          fixed lg:static
          top-14 sm:top-16 bottom-0 left-0
          w-64 flex-shrink-0
          bg-white border-r border-gray-200
          overflow-y-auto
          z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 sm:p-6 space-y-1">
            {/* For Investors Section */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                For Investors
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs/executive-summary"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target font-semibold bg-blue-50 text-blue-700"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Executive Summary ⭐
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/investor-pitch"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Investor Pitch
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/complete-roadmap"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Product Roadmap
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Product Documentation */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Product Docs
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Overview
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/product-overview"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Product Overview
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/complete-vision"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Complete Vision
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/quick-start"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Quick Start
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* User Guides */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                <Users className="h-3 w-3" />
                User Guides
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs/dual-ai-interface"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Dual AI Interface
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/supplier-guide"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Supplier Guide
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/quote-workflow"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Quote Workflow
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/multi-company"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Multi-Company
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Technical Section */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                <Code className="h-3 w-3" />
                Technical
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs/architecture"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Architecture
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/database"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Database Schema
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/implementation"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Implementation
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/code-migration"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Code Migration
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 lg:p-12 prose prose-sm sm:prose lg:prose-lg max-w-none prose-blue prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-4xl prose-h1:mb-6 prose-h1:bg-gradient-to-r prose-h1:from-blue-600 prose-h1:to-purple-600 prose-h1:bg-clip-text prose-h1:text-transparent prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-gray-800 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-700 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-bold prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
