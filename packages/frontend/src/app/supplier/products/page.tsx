'use client';

/**
 * DEPRECATED: This page is deprecated in favor of /supplier/dashboard
 * which includes full product management with price expiry and special prices.
 * This page redirects to the new dashboard.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SupplierProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to the new dashboard which has all the features
    if (isAuthenticated && (user?.type === 'supplier' || user?.tenant?.type === 'supplier')) {
      router.replace('/supplier/dashboard');
    } else if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
