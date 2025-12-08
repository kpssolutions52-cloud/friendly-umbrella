'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { useRouter } from 'next/navigation';
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
  supplierLogoUrl: string | null;
  productImageUrl: string | null;
  price: number | null;
  priceType: 'default' | 'private' | null;
  currency: string | null;
  defaultPrice: {
    price: number;
    currency: string;
  } | null;
  privatePrice: {
    price: number | null;
    discountPercentage: number | null;
    calculatedPrice: number | null;
    currency: string;
  } | null;
}

export default function CustomerDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Redirect if not customer
  useEffect(() => {
    if (user && user.role !== 'customer') {
      if (user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user.tenant?.type === 'supplier') {
        router.push('/supplier/dashboard');
      } else if (user.tenant?.type === 'company') {
        router.push('/company/dashboard');
      }
    }
  }, [user, router]);

  if (!user || user.role !== 'customer') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Product listing and filtering
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<SearchProduct[]>([]);
  const [filters, setFilters] = useState({
    supplierId: '',
    category: '',
    search: '',
  });
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 10;
  
  // Searchable dropdown states
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Load products with filters using public API
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
        `/api/v1/products/public?${params.toString()}`
      );
      
      setAllProducts(response.products);
      setFilteredProducts(response.products);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load products:', error);
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
        // Load suppliers from public API
        const suppliersResponse = await apiGet<{ suppliers: Array<{ id: string; name: string; logoUrl: string | null }> }>('/api/v1/suppliers/public');
        setSuppliers(suppliersResponse.suppliers);

        // Load categories from public API
        const categoriesResponse = await apiGet<{ categories: string[] }>('/api/v1/products/public/categories');
        setCategories(categoriesResponse.categories);
      } catch (error: any) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Load products when filters change or on initial mount
  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.supplier-dropdown-container') && !target.closest('.category-dropdown-container')) {
        setSupplierDropdownOpen(false);
        setCategoryDropdownOpen(false);
      }
    };

    if (supplierDropdownOpen || categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [supplierDropdownOpen, categoryDropdownOpen]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Product Catalog
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">
                Welcome, {user?.firstName || ''} {user?.lastName || ''}
              </p>
            </div>
            {/* Desktop menu */}
            <div className="hidden sm:flex items-center gap-2">
              <Button onClick={logout} variant="outline" className="touch-target">
                Logout
              </Button>
            </div>
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="touch-target"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </Button>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-4 space-y-2 pb-4 border-t border-gray-200 pt-4">
              <Button onClick={logout} variant="outline" className="w-full touch-target justify-start">
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Product Filters */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Browse Products</h2>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ supplierId: '', category: '', search: '' });
                setSupplierSearchQuery('');
                setCategorySearchQuery('');
                setSupplierDropdownOpen(false);
                setCategoryDropdownOpen(false);
              }}
              className="touch-target w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative supplier-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Supplier
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or select supplier..."
                  value={supplierDropdownOpen ? supplierSearchQuery : (filters.supplierId ? suppliers.find(s => s.id === filters.supplierId)?.name || '' : '')}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    if (!supplierDropdownOpen) setSupplierDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setSupplierDropdownOpen(true);
                    setSupplierSearchQuery('');
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSupplierDropdownOpen(!supplierDropdownOpen);
                    if (!supplierDropdownOpen) setSupplierSearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={supplierDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
                {supplierDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleFilterChange('supplierId', '');
                        setSupplierSearchQuery('');
                        setSupplierDropdownOpen(false);
                      }}
                    >
                      All Suppliers
                    </div>
                    {suppliers
                      .filter(supplier =>
                        supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())
                      )
                      .map((supplier) => (
                        <div
                          key={supplier.id}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                            filters.supplierId === supplier.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            handleFilterChange('supplierId', supplier.id);
                            setSupplierSearchQuery('');
                            setSupplierDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {supplier.logoUrl ? (
                              <img
                                src={supplier.logoUrl}
                                alt={supplier.name}
                                className="h-6 w-6 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                {supplier.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{supplier.name}</span>
                          </div>
                        </div>
                      ))}
                    {suppliers.filter(supplier =>
                      supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())
                    ).length === 0 && supplierSearchQuery && (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No suppliers found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative category-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or select category..."
                  value={categoryDropdownOpen ? categorySearchQuery : filters.category}
                  onChange={(e) => {
                    setCategorySearchQuery(e.target.value);
                    if (!categoryDropdownOpen) setCategoryDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setCategoryDropdownOpen(true);
                    setCategorySearchQuery('');
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCategoryDropdownOpen(!categoryDropdownOpen);
                    if (!categoryDropdownOpen) setCategorySearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categoryDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleFilterChange('category', '');
                        setCategorySearchQuery('');
                        setCategoryDropdownOpen(false);
                      }}
                    >
                      All Categories
                    </div>
                    {categories
                      .filter(category =>
                        category.toLowerCase().includes(categorySearchQuery.toLowerCase())
                      )
                      .map((category) => (
                        <div
                          key={category}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                            filters.category === category ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            handleFilterChange('category', category);
                            setCategorySearchQuery('');
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          {category}
                        </div>
                      ))}
                    {categories.filter(category =>
                      category.toLowerCase().includes(categorySearchQuery.toLowerCase())
                    ).length === 0 && categorySearchQuery && (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No categories found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Product Name
              </label>
              <input
                type="text"
                placeholder="Search by product name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Available Products
            {filteredProducts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          {isLoadingProducts ? (
            <div className="text-center py-12">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found. Try adjusting your filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => {
                const hasSpecialPrice = product.privatePrice !== null && 
                  (product.privatePrice.price !== null || product.privatePrice.calculatedPrice !== null);
                const displayPrice = hasSpecialPrice && product.privatePrice && product.privatePrice.calculatedPrice !== null
                  ? product.privatePrice.calculatedPrice
                  : hasSpecialPrice && product.privatePrice && product.privatePrice.price !== null
                  ? product.privatePrice.price
                  : product.defaultPrice?.price || null;
                const priceCurrency = hasSpecialPrice && product.privatePrice && product.privatePrice.currency
                  ? product.privatePrice.currency
                  : product.defaultPrice?.currency || 'USD';

                return (
                  <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {product.productImageUrl ? (
                        <img
                          src={product.productImageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                      <div className="flex items-center gap-2 mb-2">
                        {product.supplierLogoUrl ? (
                          <img
                            src={product.supplierLogoUrl}
                            alt={product.supplierName}
                            className="h-4 w-4 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <p className="text-xs text-gray-600">{product.supplierName}</p>
                      </div>
                      {displayPrice !== null ? (
                        <div className="mb-3">
                          {hasSpecialPrice && product.defaultPrice && (
                            <p className="text-xs text-gray-400 line-through">
                              {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                            </p>
                          )}
                          <p className="text-lg font-bold text-blue-600">
                            {priceCurrency} {displayPrice.toFixed(2)}
                          </p>
                          {hasSpecialPrice && (
                            <p className="text-xs text-green-600 font-semibold">Special Price</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 mb-3">Price not available</p>
                      )}
                      <Link href={`/products/${product.id}`}>
                        <Button className="w-full" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const hasSpecialPrice = product.privatePrice !== null && 
                  (product.privatePrice.price !== null || product.privatePrice.calculatedPrice !== null);
                const displayPrice = hasSpecialPrice && product.privatePrice && product.privatePrice.calculatedPrice !== null
                  ? product.privatePrice.calculatedPrice
                  : hasSpecialPrice && product.privatePrice && product.privatePrice.price !== null
                  ? product.privatePrice.price
                  : product.defaultPrice?.price || null;
                const priceCurrency = hasSpecialPrice && product.privatePrice && product.privatePrice.currency
                  ? product.privatePrice.currency
                  : product.defaultPrice?.currency || 'USD';

                return (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {product.productImageUrl ? (
                          <img
                            src={product.productImageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {product.supplierLogoUrl ? (
                            <img
                              src={product.supplierLogoUrl}
                              alt={product.supplierName}
                              className="h-5 w-5 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <p className="text-sm text-gray-600">{product.supplierName}</p>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        )}
                        {displayPrice !== null ? (
                          <div className="mb-3">
                            {hasSpecialPrice && product.defaultPrice && (
                              <p className="text-sm text-gray-400 line-through">
                                {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                              </p>
                            )}
                            <p className="text-xl font-bold text-blue-600">
                              {priceCurrency} {displayPrice.toFixed(2)}
                            </p>
                            {hasSpecialPrice && (
                              <p className="text-xs text-green-600 font-semibold">Special Price</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 mb-3">Price not available</p>
                        )}
                        <Link href={`/products/${product.id}`}>
                          <Button size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
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
        </div>
      </main>
    </div>
  );
}
