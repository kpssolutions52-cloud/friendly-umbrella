'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';

// Demo account credentials
const DEMO_ACCOUNTS = {
  qs: {
    email: 'demo.qs@constructionguru.com',
    password: 'DemoQS123!',
    name: 'Demo QS Professional',
    description: 'Try the QS Professional experience with AI-powered quoting and project management',
  },
  supplier: {
    email: 'demo.supplier@constructionguru.com',
    password: 'DemoSupplier123!',
    name: 'Demo Supplier',
    description: 'Try the Supplier experience with product management and quote responses',
  },
};

function DemoLoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState<'qs' | 'supplier' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (accountType: 'qs' | 'supplier') => {
    try {
      setLoading(true);
      setError(null);
      const account = DEMO_ACCOUNTS[accountType];
      
      await login(
        {
          email: account.email,
          password: account.password,
        },
        accountType === 'qs' ? '/chat' : '/supplier/products'
      );
    } catch (err: any) {
      console.error('Demo login error:', err);
      console.error('Error details:', {
        error: err,
        errorMessage: err?.error?.message,
        message: err?.message,
        response: err?.response,
      });
      
      // Show more detailed error message
      const errorMessage = 
        err?.error?.message ||
        err?.message ||
        err?.error ||
        'Demo login failed. Please ensure demo accounts are set up in the database.';
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start sm:items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8 pb-8">
        {/* Logo and Back to Home */}
        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
              <Logo
                src="/images/logo.jpg"
                alt="ConstructionGuru"
                width={64}
                height={64}
                priority
                unoptimized
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-gray-900">ConstructionGuru</div>
              <div className="text-xs font-semibold text-gray-700 -mt-0.5">AI-Powered Construction Platform</div>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="text-center">
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Try ConstructionGuru Demo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Experience our AI-powered platform with pre-configured demo accounts
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              If demo accounts don't exist, please run the database seed script first.
            </p>
          </div>
        )}

        {/* Demo Account Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {/* QS Professional Demo */}
          <div
            className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
              selectedAccount === 'qs'
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedAccount('qs')}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">QS Professional</h3>
                <p className="mt-1 text-sm text-gray-600">{DEMO_ACCOUNTS.qs.description}</p>
              </div>
              {selectedAccount === 'qs' && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Demo */}
          <div
            className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
              selectedAccount === 'supplier'
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedAccount('supplier')}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">Supplier</h3>
                <p className="mt-1 text-sm text-gray-600">{DEMO_ACCOUNTS.supplier.description}</p>
              </div>
              {selectedAccount === 'supplier' && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Login Button */}
        <div className="mt-6">
          <Button
            onClick={() => selectedAccount && handleDemoLogin(selectedAccount)}
            disabled={!selectedAccount || loading}
            className="w-full py-6 text-lg font-semibold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              `Try ${selectedAccount === 'qs' ? 'QS Professional' : selectedAccount === 'supplier' ? 'Supplier' : 'Demo'} Demo`
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> These are demo accounts with pre-configured data. You can explore all features
            without creating your own account. Changes made in demo mode are temporary and will be reset.
          </p>
        </div>

        {/* Alternative Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Want to create your own account?{' '}
            <Link href="/auth/register-simple" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up here
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DemoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <DemoLoginForm />
    </Suspense>
  );
}
