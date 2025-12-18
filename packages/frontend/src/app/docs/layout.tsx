import Link from 'next/link';
import { Metadata } from 'next';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Documentation - ConstructionGuru',
  description: 'Complete documentation for Construction Pricing Platform',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Top Navigation */}
      <nav className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                {/* Logo */}
                <div className="relative h-8 w-8 flex-shrink-0">
                  <Logo
                    src="/images/logo.jpg"
                    alt="ConstructionGuru"
                    width={32}
                    height={32}
                    priority
                    unoptimized
                  />
                </div>
                {/* Company Name */}
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    ConstructionGuru
                  </div>
                  <div className="text-xs font-semibold text-gray-700 -mt-0.5">
                    Real-Time Pricing for Construction Professionals
                  </div>
                </div>
              </Link>
              <div className="ml-8 flex space-x-8">
                <Link
                  href="/docs"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-blue-500"
                >
                  Documentation
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content Area with Fixed Sidebar and Scrollable Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-6 space-y-1">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User Guide
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs/user-guide/getting-started"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/user-guide/supplier-guide"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    Supplier Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/user-guide/company-guide"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    Company Guide
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/user-guide/api-testing"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    API Testing
                  </Link>
                </li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Technical
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/docs/technical/architecture"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/technical/api-reference"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/technical/price-management-flow"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    Price Management Flow
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/technical/setup"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    Setup & Installation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/technical/deployment"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-sm rounded-md"
                  >
                    Deployment
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg p-8 prose prose-blue max-w-none">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

