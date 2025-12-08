'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StatisticsOverview } from '@/components/admin/StatisticsOverview';
import { PendingTenants } from '@/components/admin/PendingTenants';
import { PendingCustomers } from '@/components/admin/PendingCustomers';
import { Companies } from '@/components/admin/Companies';
import { Suppliers } from '@/components/admin/Suppliers';
import { SuperAdminManagement } from '@/components/admin/SuperAdminManagement';
import { CategoryManagement } from '@/components/admin/CategoryManagement';

type TabType = 'overview' | 'super-admins' | 'categories';
type ViewType = 'overview' | 'pending' | 'companies' | 'suppliers' | 'customers';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeView, setActiveView] = useState<ViewType>('overview');

  // Check if user is super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be a super admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Super Admin Panel</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.firstName} {user.lastName} ({user.email})
              </span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('overview');
                setActiveView('overview');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('super-admins')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'super-admins'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Super Admins
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {activeView === 'overview' && <StatisticsOverview onViewChange={setActiveView} />}
            {activeView === 'pending' && (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Back to Overview
                  </button>
                </div>
                <PendingTenants />
              </>
            )}
            {activeView === 'customers' && (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Back to Overview
                  </button>
                </div>
                <PendingCustomers />
              </>
            )}
            {activeView === 'companies' && (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Back to Overview
                  </button>
                </div>
                <Companies />
              </>
            )}
            {activeView === 'suppliers' && (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Back to Overview
                  </button>
                </div>
                <Suppliers />
              </>
            )}
          </>
        )}
        {activeTab === 'super-admins' && <SuperAdminManagement />}
        {activeTab === 'categories' && <CategoryManagement />}
      </main>
    </div>
  );
}



