import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - Construction Pricing Platform',
  description: 'Complete documentation for Construction Pricing Platform',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900">
                  Construction Pricing Platform
                </span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          <aside className="w-64 flex-shrink-0 pr-8">
            <nav className="space-y-1">
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
          <main className="flex-1 min-w-0">
            <div className="bg-white shadow rounded-lg p-8 prose prose-blue max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

