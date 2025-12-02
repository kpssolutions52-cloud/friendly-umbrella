'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

interface SearchProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  supplierId: string;
  supplierName: string;
  price: number | null;
  priceType: 'default' | 'private' | null;
  currency: string | null;
}

interface ProductSupplierPrice {
  productId: string;
  productName: string;
  productSku: string;
  supplierId: string;
  supplierName: string;
  defaultPrice: number | null;
  privatePrice: number | null;
  currency: string;
  unit: string;
}

export default function CompanyDashboardPage() {
  return (
    <ProtectedRoute requireTenantType="company">
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const [productPrices, setProductPrices] = useState<ProductSupplierPrice[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  
  // Product listing and filtering
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<SearchProduct[]>([]);
  const [filters, setFilters] = useState({
    supplierId: '',
    category: '',
    search: '',
  });
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 20;

  // Load products with filters
  const loadProducts = useCallback(async (page = 1) => {
    setIsLoadingProducts(true);
    const params = new URLSearchParams();
    if (filters.search) {
      params.append('q', filters.search);
    }
    if (filters.supplierId) {
      params.append('supplierId', filters.supplierId);
    }
    if (filters.category) {
      params.append('category', filters.category);
    }
    params.append('page', page.toString());
    params.append('limit', productsPerPage.toString());

    try {
      const response = await apiGet<{ products: SearchProduct[]; pagination: { page: number; totalPages: number; total: number } }>(
        `/api/v1/products/search?${params.toString()}`
      );
      
      setAllProducts(response.products);
      setFilteredProducts(response.products);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      console.error('Error details:', {
        message: error?.error?.message || error?.message,
        statusCode: error?.error?.statusCode || error?.status,
        endpoint: `/api/v1/products/search?${params.toString()}`,
      });
      setAllProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [filters.search, filters.supplierId, filters.category]);

  // Load suppliers and categories on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load suppliers
        const suppliersResponse = await apiGet<{ suppliers: Array<{ id: string; name: string }> }>('/api/v1/suppliers');
        setSuppliers(suppliersResponse.suppliers);

        // Load categories
        const categoriesResponse = await apiGet<{ categories: string[] }>('/api/v1/products/categories');
        setCategories(categoriesResponse.categories);
      } catch (error: any) {
        console.error('Failed to load initial data:', error);
        console.error('Error details:', {
          message: error?.error?.message || error?.message,
          statusCode: error?.error?.statusCode || error?.status,
        });
      }
    };

    loadInitialData();
  }, []);

  // Load products when filters change or on initial mount
  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);


  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Fetch product prices from all suppliers
  const fetchProductPrices = async (product: SearchProduct) => {
    setIsLoadingPrices(true);
    try {
      // Search for products with the same name/SKU to find all suppliers
      const searchTerm = product.sku || product.name;
      const response = await apiGet<{ products: SearchProduct[] }>(
        `/api/v1/products/search?q=${encodeURIComponent(searchTerm)}&limit=100`
      );

      // Group by product name+SKU combination to find all suppliers with the same product
      const productKey = `${product.name}-${product.sku}`.toLowerCase();
      const matchingProducts = response.products.filter(
        (p) => `${p.name}-${p.sku}`.toLowerCase() === productKey
      );

      // Group by supplier - the API returns the price that applies (private if available, else default)
      // We need to fetch default prices for products that show private prices
      const supplierProducts = new Map<string, SearchProduct>();
      matchingProducts.forEach((p) => {
        // Keep the product with private price if available, otherwise keep default
        const existing = supplierProducts.get(p.supplierId);
        if (!existing || (p.priceType === 'private' && existing.priceType !== 'private')) {
          supplierProducts.set(p.supplierId, p);
        }
      });

      // Transform to supplier price format
      // Note: API returns the applicable price (private if available, else default)
      // For products with private prices, we'll show the private price and indicate default exists
      const prices: ProductSupplierPrice[] = Array.from(supplierProducts.values()).map((p) => {
        return {
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          supplierId: p.supplierId,
          supplierName: p.supplierName,
          defaultPrice: p.priceType === 'default' ? p.price : null, // Will be null if private price exists
          privatePrice: p.priceType === 'private' ? p.price : null,
          currency: p.currency || 'USD',
          unit: p.unit,
        };
      });

      // For products showing private prices, try to fetch default prices
      const pricesWithDefaults = await Promise.all(
        prices.map(async (price) => {
          if (price.privatePrice !== null && price.defaultPrice === null) {
            // Try to get default price from supplier's catalog
            try {
              const supplierProductsResponse = await apiGet<{ products: SearchProduct[] }>(
                `/api/v1/suppliers/${price.supplierId}/products?search=${encodeURIComponent(price.productSku)}&limit=10`
              );
              // Find the same product with default price
              const defaultProduct = supplierProductsResponse.products.find(
                (sp) => sp.sku === price.productSku && sp.priceType === 'default'
              );
              if (defaultProduct) {
                return { ...price, defaultPrice: defaultProduct.price };
              }
            } catch (error) {
              console.warn('Could not fetch default price:', error);
            }
          }
          return price;
        })
      );

      // Sort by price (private price if available, otherwise default)
      pricesWithDefaults.sort((a, b) => {
        const priceA = a.privatePrice ?? a.defaultPrice ?? Infinity;
        const priceB = b.privatePrice ?? b.defaultPrice ?? Infinity;
        return priceA - priceB;
      });

              setProductPrices(pricesWithDefaults);
      setSelectedProduct(product);
    } catch (error) {
      console.error('Failed to fetch product prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  const handleProductSelect = (product: SearchProduct) => {
    fetchProductPrices(product);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Price Tracker
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {user?.tenant?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'company_admin' && (
                <Link href="/company/users">
                  <Button variant="outline">User Management</Button>
                </Link>
              )}
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Product Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Browse Products</h2>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ supplierId: '', category: '', search: '' });
              }}
            >
              Clear Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Supplier
              </label>
              <select
                value={filters.supplierId}
                onChange={(e) => handleFilterChange('supplierId', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search in Results
              </label>
              <input
                type="text"
                placeholder="Search in filtered results..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Products
              {filteredProducts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
                </span>
              )}
            </h2>
          </div>

          {isLoadingProducts ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filters.supplierId || filters.category || filters.search
                ? 'No products match your filters. Try adjusting your filters.'
                : 'No products available yet. Suppliers need to add products with default prices.'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={`${product.id}-${product.supplierId}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.price ? (
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {product.currency} {product.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.priceType === 'private' ? (
                                  <span className="text-green-600">Special Rate</span>
                                ) : (
                                  <span>Default Price</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No price</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductSelect(product)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadProducts(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadProducts(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Product Prices Table */}
        {selectedProduct && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500">
                  SKU: {selectedProduct.sku} • Unit: {selectedProduct.unit}
                  {selectedProduct.category && ` • Category: ${selectedProduct.category}`}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProduct(null);
                  setProductPrices([]);
                }}
              >
                Clear Selection
              </Button>
            </div>

            {isLoadingPrices ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-500">Loading supplier prices...</p>
              </div>
            ) : productPrices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No suppliers found for this product
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Default Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Savings
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productPrices.map((price, index) => {
                      const hasPrivatePrice = price.privatePrice !== null;
                      const savings = price.defaultPrice && price.privatePrice
                        ? ((price.defaultPrice - price.privatePrice) / price.defaultPrice * 100).toFixed(1)
                        : null;

                      return (
                        <tr key={`${price.supplierId}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {price.supplierName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {price.defaultPrice !== null ? (
                              <div className="text-sm text-gray-900">
                                {price.currency} {price.defaultPrice.toFixed(2)}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not set</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hasPrivatePrice ? (
                              <div className="flex items-center">
                                <span className="text-sm font-semibold text-green-600">
                                  {price.currency} {price.privatePrice!.toFixed(2)}
                                </span>
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Special Rate
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No special rate</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {price.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {savings && parseFloat(savings) > 0 ? (
                              <span className="text-sm font-semibold text-green-600">
                                {savings}% off
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Price Updates</h2>
            <p className="text-gray-500">No price updates yet.</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">My Suppliers</h2>
            <p className="text-gray-500">No suppliers yet.</p>
          </div>
        </div>
      </main>
    </div>
  );
}


