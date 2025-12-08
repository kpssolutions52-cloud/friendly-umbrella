'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/') ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill={isActive('/') ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Search - Always visible on landing page */}
        <button
          onClick={() => {
            const searchElement = document.getElementById('mobile-search-trigger');
            if (searchElement) {
              searchElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                const input = document.getElementById('mobile-search-input') as HTMLInputElement;
                if (input) {
                  input.focus();
                }
              }, 300);
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            pathname === '/' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-xs font-medium">Search</span>
        </button>

        {/* Dashboard/Account */}
        {user ? (
          <button
            onClick={() => {
              if (user.role === 'super_admin') {
                router.push('/admin/dashboard');
              } else if (user.role === 'customer') {
                router.push('/');
              } else if (user.tenant?.type === 'supplier') {
                router.push('/supplier/dashboard');
              } else {
                router.push('/company/dashboard');
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname?.includes('/dashboard') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
        ) : (
          <Link
            href="/auth/login"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/auth/login' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs font-medium">Account</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
