'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost, apiGet } from '@/lib/api';

export default function SupplierDashboardPage() {
  return (
    <ProtectedRoute requireTenantType="supplier">
      <DashboardContent />
    </ProtectedRoute>
  );
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  productsWithPrices: number;
  productsWithPrivatePrices: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  isActive: boolean;
  defaultPrices: Array<{
    id: string;
    price: number;
    currency: string;
    isActive: boolean;
  }>;
  _count: {
    privatePrices: number;
  };
}

type FilterType = 'all' | 'active' | 'withPrices' | 'withPrivatePrices' | null;

function DashboardContent() {
  const { user, logout } = useAuth();
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    productsWithPrices: 0,
    productsWithPrivatePrices: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unit: '',
    defaultPrice: '',
    currency: 'USD',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await apiGet<ProductStats>('/api/v1/products/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchProducts = async (filter: FilterType) => {
    if (!filter) {
      setProducts([]);
      return;
    }

    setIsLoadingProducts(true);
    try {
      let endpoint = '/api/v1/products';
      const params = new URLSearchParams();

      if (filter === 'all') {
        params.append('includeInactive', 'true');
      } else if (filter === 'active') {
        params.append('includeInactive', 'false');
      }

      const response = await apiGet<{ products: Product[] }>(
        `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`
      );

      let filteredProducts = response.products;

      // Filter client-side for more complex filters
      if (filter === 'withPrices') {
        filteredProducts = response.products.filter(
          (p) => p.defaultPrices && p.defaultPrices.length > 0 && p.defaultPrices[0].isActive
        );
      } else if (filter === 'withPrivatePrices') {
        filteredProducts = response.products.filter(
          (p) => p._count.privatePrices > 0
        );
      }

      setProducts(filteredProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleCardClick = (filter: FilterType) => {
    if (activeFilter === filter) {
      // If clicking the same card, close the list
      setActiveFilter(null);
      setProducts([]);
    } else {
      setActiveFilter(filter);
      fetchProducts(filter);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const payload = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        unit: formData.unit,
        defaultPrice: formData.defaultPrice ? parseFloat(formData.defaultPrice) : undefined,
        currency: formData.currency,
      };

      await apiPost('/api/v1/products', payload);
      setSuccess(true);
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: '',
        unit: '',
        defaultPrice: '',
        currency: 'USD',
      });
      
      // Refresh stats after product creation
      await fetchStats();
      
      // Refresh product list if a filter is active
      if (activeFilter) {
        await fetchProducts(activeFilter);
      }
      
      // Close modal after 1 second
      setTimeout(() => {
        setShowAddProductModal(false);
        setSuccess(false);
      }, 1000);
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setShowAddProductModal(false);
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Supplier Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {user?.tenant?.name}
              </p>
            </div>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleCardClick('all')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats.totalProducts}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Products
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              activeFilter === 'active' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleCardClick('active')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats.activeProducts}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Products
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              activeFilter === 'withPrices' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleCardClick('withPrices')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats.productsWithPrices}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Products with Prices
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              activeFilter === 'withPrivatePrices' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => handleCardClick('withPrivatePrices')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats.productsWithPrivatePrices}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Private Prices
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product List Section */}
        {activeFilter && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeFilter === 'all' && 'All Products'}
                {activeFilter === 'active' && 'Active Products'}
                {activeFilter === 'withPrices' && 'Products with Prices'}
                {activeFilter === 'withPrivatePrices' && 'Products with Private Prices'}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({products.length})
                </span>
              </h2>
              <button
                onClick={() => {
                  setActiveFilter(null);
                  setProducts([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingProducts ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No products found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.defaultPrices && product.defaultPrices.length > 0 ? (
                            <span>
                              {product.defaultPrices[0].currency} {Number(product.defaultPrices[0].price).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">No price</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <Button onClick={() => setShowAddProductModal(true)}>Add Product</Button>
              <Button variant="outline">Import CSV</Button>
              <Button variant="outline">View Products</Button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  Product created successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="PROD-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="piece, kg, m, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Steel Beam 10x10"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Product description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="Steel, Cement, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="SGD">SGD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="defaultPrice">Default Price</Label>
                  <Input
                    id="defaultPrice"
                    name="defaultPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.defaultPrice}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="150.00"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


