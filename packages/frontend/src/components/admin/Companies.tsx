'use client';

import { useEffect, useState } from 'react';
import { getAllTenants, toggleTenantStatus, Tenant } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Companies() {
  const [companies, setCompanies] = useState<Tenant[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    // Filter companies by name (case-insensitive)
    if (!searchTerm.trim()) {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getAllTenants(undefined, 'company');
      setCompanies(data.tenants);
      setFilteredCompanies(data.tenants);
      setError(null);
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (companyId: string, newStatus: boolean) => {
    // Store previous state for rollback on error
    const previousCompanies = [...companies];
    const previousFiltered = [...filteredCompanies];
    
    // Optimistically update UI immediately
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId ? { ...company, isActive: newStatus } : company
      )
    );
    setFilteredCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId ? { ...company, isActive: newStatus } : company
      )
    );
    
    try {
      setTogglingId(companyId);
      await toggleTenantStatus(companyId, newStatus);
    } catch (err: any) {
      // Rollback on error
      setCompanies(previousCompanies);
      setFilteredCompanies(previousFiltered);
      alert(err?.error?.message || 'Failed to toggle company status');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
        <Button onClick={loadCompanies} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <Input
          type="text"
          placeholder="Search companies by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'No companies match your search.' : 'No companies have been registered yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{company.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : company.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company._count?.users || company.users.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {company.status === 'active' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={company.isActive ? 'default' : 'outline'}
                          onClick={() => handleToggleStatus(company.id, true)}
                          disabled={togglingId === company.id || company.isActive}
                          className={company.isActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700'}
                        >
                          Active
                        </Button>
                        <Button
                          size="sm"
                          variant={!company.isActive ? 'default' : 'outline'}
                          onClick={() => handleToggleStatus(company.id, false)}
                          disabled={togglingId === company.id || !company.isActive}
                          className={!company.isActive ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'text-gray-700'}
                        >
                          Inactive
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

