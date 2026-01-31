'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Menu, X } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Fixed Top Navigation */}
      <nav className="bg-white border-b border-gray-200 flex-shrink-0 z-20">
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
                    QS AI Agent
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
            {/* Non-Technical Section */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Non-Technical
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/product-overview"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    What is QS AI Agent?
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/quick-start"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Quick Start
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/multi-company"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Multi-Company Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/quote-workflow"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Quote Workflow Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Technical Section */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                Technical
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs/architecture"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/database"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Database Schema
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/implementation"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Implementation Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/code-migration"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Code Migration Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/quote-workflow-architecture"
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 block px-3 py-2 text-sm rounded-md transition-colors touch-target"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Quote Workflow Architecture
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 lg:p-8 prose prose-sm sm:prose lg:prose-lg max-w-none prose-blue">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
