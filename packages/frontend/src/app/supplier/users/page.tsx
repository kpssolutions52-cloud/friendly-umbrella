'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserManagement } from '@/components/admin/UserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SupplierUsersPage() {
  return (
    <ProtectedRoute requireTenantType="supplier">
      <UsersPageContent />
    </ProtectedRoute>
  );
}

function UsersPageContent() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // Redirect to landing page if user is not an admin
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'supplier_admin') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
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

  // Don't render anything if user is not authorized (redirecting)
  if (!user || user.role !== 'supplier_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-500">Manage users for {user?.tenant?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/supplier/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagement />
      </main>
    </div>
  );
}





