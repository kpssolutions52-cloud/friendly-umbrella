'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet, apiPost } from '@/lib/api';
import { X, Search, Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
}

interface BulkPriceOverrideModalProps {
  productId: string;
  productName: string;
  defaultPrice?: number;
  defaultCurrency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkPriceOverrideModal({
  productId,
  productName,
  defaultPrice,
  defaultCurrency = 'USD',
  onClose,
  onSuccess,
}: BulkPriceOverrideModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    price: defaultPrice?.toString() || '',
    currency: defaultCurrency,
  });

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet<{ companies: Company[] }>('/api/v1/companies');
      setCompanies(response.companies || []);
      setFilteredCompanies(response.companies || []);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
      setError(err?.error?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Filter companies based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = companies.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.email.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const handleToggleCompany = (companyId: string) => {
    setSelectedCompanyIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedCompanyIds.size === filteredCompanies.length) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set(filteredCompanies.map((c) => c.id)));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selectedCompanyIds.size === 0) {
      setError('Please select at least one company');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setSubmitting(true);
      const price = parseFloat(formData.price);

      // Create private prices for all selected companies
      const promises = Array.from(selectedCompanyIds).map((companyId) =>
        apiPost(`/api/v1/products/${productId}/private-prices`, {
          companyId,
          price,
          currency: formData.currency,
        })
      );

      await Promise.all(promises);
      setSuccess(`Successfully set prices for ${selectedCompanyIds.size} company(ies)`);
      
      // Notify parent and close after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to set prices:', err);
      setError(err?.error?.message || 'Failed to set prices. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Override Price for Companies</h2>
              <p className="text-sm text-gray-500 mt-1">Product: {productName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Price Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="price">Override Price *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  placeholder={defaultPrice?.toString() || "0.00"}
                  className="mt-1"
                />
                {defaultPrice && (
                  <p className="text-xs text-gray-500 mt-1">
                    Default price: {defaultPrice.toFixed(2)} {defaultCurrency}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
            </div>
          </form>

          {/* Company Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">
                Select Companies ({selectedCompanyIds.size} selected)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCompanyIds.size === filteredCompanies.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Company List */}
            <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Loading companies...</p>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No companies found matching your search.' : 'No companies available.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredCompanies.map((company) => (
                    <label
                      key={company.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCompanyIds.has(company.id)}
                        onChange={() => handleToggleCompany(company.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        <div className="text-xs text-gray-500">{company.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || selectedCompanyIds.size === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting Prices...
              </>
            ) : (
              `Set Price for ${selectedCompanyIds.size} Company${selectedCompanyIds.size !== 1 ? 'ies' : 'y'}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
