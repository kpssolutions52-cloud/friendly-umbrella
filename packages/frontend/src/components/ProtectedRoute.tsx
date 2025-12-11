'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenantType?: 'supplier' | 'company' | 'service_provider';
}

export function ProtectedRoute({
  children,
  requireTenantType,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (
        requireTenantType &&
        user.tenant?.type !== requireTenantType
      ) {
        // Redirect to appropriate dashboard
        let dashboardPath = '/';
        if (user.tenant?.type === 'supplier') {
          dashboardPath = '/supplier/dashboard';
        } else if (user.tenant?.type === 'service_provider') {
          dashboardPath = '/service-provider/dashboard';
        } else if (user.tenant?.type === 'company') {
          dashboardPath = '/company/dashboard';
        }
        router.push(dashboardPath);
      }
    }
  }, [user, loading, requireTenantType, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireTenantType && user.tenant?.type !== requireTenantType) {
    return null;
  }

  return <>{children}</>;
}

