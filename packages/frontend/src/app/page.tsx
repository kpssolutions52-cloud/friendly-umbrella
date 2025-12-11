'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { apiGet, getMainCategories, getSubcategories, getMainServiceCategories, getServiceSubcategories, ProductCategory, ServiceCategory } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { BottomNavigation } from '@/components/BottomNavigation';

interface PublicProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  type?: 'product' | 'service';
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

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [forceRender, setForceRender] = useState(false);

  // Emergency fallback: force render after much shorter time on mobile
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const emergencyTimeout = isMobile ? 6000 : 10000; // 6s mobile, 10s desktop
    
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        console.warn('Emergency timeout: forcing page render despite auth loading');
        setForceRender(true);
      }
    }, emergencyTimeout);
    return () => clearTimeout(timeoutId);
  }, [authLoading]);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [mainCategories, setMainCategories] = useState<ProductCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ProductCategory[]>([]);
  const [mainServiceCategories, setMainServiceCategories] = useState<ServiceCategory[]>([]);
  const [subServiceCategories, setSubServiceCategories] = useState<ServiceCategory[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([]);
  const [serviceProviders, setServiceProviders] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('default');
  const productsPerPage = 20;

  // Handle auth redirects - separate effect to avoid loops
  useEffect(() => {
    if (!authLoading && user) {
      // Redirect to appropriate dashboard
      if (user.role === 'super_admin') {
        router.push('/admin/dashboard');
        return;
      }
      if (user.role === 'customer') {
        router.push('/customer/dashboard');
        return;
      }
      if (user.tenant) {
        let dashboardPath: string;
        if (user.tenant.type === 'supplier') {
          dashboardPath = '/supplier/dashboard';
        } else if (user.tenant.type === 'service_provider') {
          dashboardPath = '/service-provider/dashboard';
        } else {
          dashboardPath = '/company/dashboard';
        }
        router.push(dashboardPath);
        return;
      }
    }
  }, [authLoading, user, router]);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      // Add type filter based on active tab
      params.append('type', activeTab === 'products' ? 'product' : 'service');
      
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      
      // Use subcategory if selected, otherwise use main category
      // For products, use product categories; for services, use service categories
      if (activeTab === 'products') {
        const categoryId = selectedSubCategoryId || selectedMainCategoryId;
        if (categoryId) {
          params.append('category', categoryId);
        }
        if (selectedSupplier) {
          params.append('supplierId', selectedSupplier);
        }
      } else {
        // For services, use service categories
        const serviceCategoryId = selectedSubCategoryId || selectedMainCategoryId;
        if (serviceCategoryId) {
          params.append('serviceCategoryId', serviceCategoryId);
        }
        if (selectedSupplier) {
          params.append('supplierId', selectedSupplier); // service providers
        }
      }
      
      params.append('page', currentPage.toString());
      params.append('limit', productsPerPage.toString());

      const response = await apiGet<{ products: PublicProduct[]; pagination: { page: number; totalPages: number; total: number } }>(
        `/api/v1/products/public?${params.toString()}`
      );

      setProducts(response.products);
      // Only update currentPage if it's different (prevents infinite loops)
      if (response.pagination.page !== currentPage) {
        setCurrentPage(response.pagination.page);
      }
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [currentPage, searchQuery, selectedMainCategoryId, selectedSubCategoryId, selectedSupplier, activeTab]);

  const loadMainCategories = useCallback(async () => {
    try {
      const response = await getMainCategories();
      setMainCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load main categories:', error);
      setMainCategories([]);
    }
  }, []);

  const loadMainServiceCategories = useCallback(async () => {
    try {
      const response = await getMainServiceCategories();
      setMainServiceCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load main service categories:', error);
      setMainServiceCategories([]);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await apiGet<{ suppliers: Array<{ id: string; name: string; logoUrl: string | null }> }>('/api/v1/suppliers/public');
      setSuppliers(response.suppliers);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  }, []);

  const loadServiceProviders = useCallback(async () => {
    try {
      const response = await apiGet<{ suppliers: Array<{ id: string; name: string; logoUrl: string | null }> }>('/api/v1/service-providers/public');
      setServiceProviders(response.suppliers || []);
    } catch (error) {
      console.error('Failed to load service providers:', error);
      setServiceProviders([]);
    }
  }, []);

  // Load initial data once when auth is done and user is guest
  useEffect(() => {
    if (!authLoading && !user) {
      // Only load categories and suppliers/service providers once - don't block if they fail
      // Use setTimeout to ensure page can render even if API is slow
      const loadData = async () => {
        try {
          await Promise.allSettled([
            loadMainCategories(),
            loadMainServiceCategories(),
            loadSuppliers(),
            loadServiceProviders(),
          ]);
        } catch (err) {
          console.error('Failed to load initial data:', err);
        }
      };
      loadData();
    }
  }, [authLoading, user, loadMainCategories, loadMainServiceCategories, loadSuppliers, loadServiceProviders]);

  // Load products/services when filters/search/tab change - separate from initial data load
  useEffect(() => {
    if (!authLoading && !user) {
      // Reset filters when tab changes
      setSelectedMainCategoryId('');
      setSelectedSubCategoryId('');
      setSelectedSupplier('');
      setCurrentPage(1);
      // Load products/services - ensure loading state is always cleared
      loadProducts().catch(err => {
        console.error('Failed to load products/services:', err);
        setIsLoadingProducts(false);
      });
    }
  }, [authLoading, user, loadProducts, activeTab]);

  // Reload subcategories when main category changes (backup mechanism)
  useEffect(() => {
    if (activeTab === 'products') {
      if (selectedMainCategoryId) {
        loadSubCategories(selectedMainCategoryId);
      } else {
        setSubCategories([]);
      }
    } else {
      if (selectedMainCategoryId) {
        loadSubServiceCategories(selectedMainCategoryId);
      } else {
        setSubServiceCategories([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMainCategoryId, activeTab]);

  const loadSubCategories = async (parentId: string) => {
    if (!parentId) {
      setSubCategories([]);
      return;
    }

    try {
      setLoadingSubCategories(true);
      const response = await getSubcategories(parentId);
      setSubCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const loadSubServiceCategories = async (parentId: string) => {
    if (!parentId) {
      setSubServiceCategories([]);
      return;
    }

    try {
      setLoadingSubCategories(true);
      const response = await getServiceSubcategories(parentId);
      setSubServiceCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load service subcategories:', error);
      setSubServiceCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const handleMainCategoryChange = async (mainCategoryId: string) => {
    setSelectedMainCategoryId(mainCategoryId);
    // Reset subcategory when main category changes
    setSelectedSubCategoryId('');
    setCurrentPage(1);
    
    // Load subcategories for the selected main category based on active tab
    if (mainCategoryId) {
      if (activeTab === 'products') {
        await loadSubCategories(mainCategoryId);
      } else {
        await loadSubServiceCategories(mainCategoryId);
      }
    } else {
      setSubCategories([]);
      setSubServiceCategories([]);
    }
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    setSelectedSubCategoryId(subCategoryId);
    setCurrentPage(1);
  };

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    setCurrentPage(1);
  };

  const getEffectivePrice = (product: PublicProduct): number => {
    // Priority: price > privatePrice.calculatedPrice > defaultPrice.price
    if (product.price !== null) {
      return product.price;
    }
    if (product.privatePrice?.calculatedPrice !== null && product.privatePrice?.calculatedPrice !== undefined) {
      return product.privatePrice.calculatedPrice;
    }
    if (product.defaultPrice?.price) {
      return product.defaultPrice.price;
    }
    return 0; // Fallback for products without price
  };

  const sortProducts = (productsToSort: PublicProduct[]): PublicProduct[] => {
    const sorted = [...productsToSort];
    
    switch (sortBy) {
      case 'price-low-high':
        return sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
      case 'price-high-low':
        return sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
      case 'name-a-z':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-z-a':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'default':
      default:
        return sorted; // Keep original order
    }
  };


  // Only show loading spinner if auth is loading AND we haven't hit emergency timeout
  if (authLoading && !forceRender) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16 sm:pb-0">
      {/* Modern Header */}
      <header className="bg-white shadow-md sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Construction Pricing
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  <span className="hidden sm:inline text-sm text-gray-600">
                    {user.firstName} {user.lastName}
                  </span>
                  {user.role === 'customer' ? (
                    <Button variant="outline" size="sm" onClick={() => router.push('/auth/logout')} className="text-xs sm:text-sm">
                      Logout
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => {
                      if (user.role === 'super_admin') {
                        router.push('/admin/dashboard');
                      } else if (user.tenant?.type === 'supplier') {
                        router.push('/supplier/dashboard');
                      } else if (user.tenant?.type === 'service_provider') {
                        router.push('/service-provider/dashboard');
                      } else {
                        router.push('/company/dashboard');
                      }
                    }} className="text-xs sm:text-sm">
                      Dashboard
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="text-xs sm:text-sm">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Find the Best Construction Materials & Services</h2>
            <p className="text-sm sm:text-lg text-blue-100 max-w-2xl mx-auto">
              Compare prices from multiple suppliers and service providers
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Products vs Services Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                setSelectedMainCategoryId('');
                setSelectedSubCategoryId('');
                setSelectedSupplier('');
                setCurrentPage(1);
              }}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'products'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('services');
                setSelectedMainCategoryId('');
                setSelectedSubCategoryId('');
                setSelectedSupplier('');
                setCurrentPage(1);
              }}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === 'services'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Services
            </button>
          </div>
        </div>
        {/* Mobile-First Modern Search - Sticky on Mobile */}
        <div id="mobile-search-trigger" className="sticky top-16 sm:top-0 sm:relative z-30 mb-6">
          <div className="bg-white rounded-xl shadow-lg sm:shadow-lg border border-gray-100 overflow-hidden">
            <form onSubmit={handleSearch} className="space-y-0">
              {/* Mobile Search Bar - Always Visible */}
              <div className="flex items-center gap-2 p-3 sm:p-4">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    id="mobile-search-input"
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 h-12 sm:h-12 text-base sm:text-base border-0 focus-visible:ring-2 focus-visible:ring-blue-500 bg-gray-50 sm:bg-white"
                  />
                </div>
                {/* Filter Toggle Button - Mobile Only */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`sm:hidden relative p-2.5 rounded-lg transition-colors ${
                    showFilters || selectedMainCategoryId || selectedSubCategoryId || selectedSupplier
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label="Toggle filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {(selectedMainCategoryId || selectedSubCategoryId || selectedSupplier) && !showFilters && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                {/* Search Button - Mobile */}
                <Button
                  type="submit"
                  size="lg"
                  className="sm:hidden h-12 px-4 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Button>
              </div>
              
              {/* Filters - Collapsible on Mobile, Always Visible on Desktop */}
              <div
                className={`${
                  showFilters ? 'block' : 'hidden'
                } sm:block border-t border-gray-100 bg-gray-50 sm:bg-white p-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4`}
              >
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Main Category
                  </label>
                  <select
                    value={selectedMainCategoryId}
                    onChange={(e) => handleMainCategoryChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">All Categories</option>
                    {(activeTab === 'products' ? mainCategories : mainServiceCategories).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Sub Category
                  </label>
                  <select
                    value={selectedSubCategoryId}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    disabled={!selectedMainCategoryId || loadingSubCategories}
                    required={!!(selectedMainCategoryId && (activeTab === 'products' ? subCategories : subServiceCategories).length > 0)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                  >
                    <option value="">
                      {loadingSubCategories 
                        ? 'Loading...' 
                        : !selectedMainCategoryId 
                          ? 'Select main category first' 
                          : (activeTab === 'products' ? subCategories : subServiceCategories).length === 0 
                            ? 'No subcategories' 
                            : 'All Subcategories'}
                    </option>
                    {(activeTab === 'products' ? subCategories : subServiceCategories).map((subCat) => (
                      <option key={subCat.id} value={subCat.id}>
                        {subCat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    {activeTab === 'products' ? 'Supplier' : 'Service Provider'}
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">All {activeTab === 'products' ? 'Suppliers' : 'Service Providers'}</option>
                    {(activeTab === 'products' ? suppliers : serviceProviders).map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Clear Filters Button - Mobile Only */}
                {(selectedMainCategoryId || selectedSubCategoryId || selectedSupplier) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMainCategoryId('');
                      setSelectedSubCategoryId('');
                      setSelectedSupplier('');
                      setSubCategories([]);
                      setSubServiceCategories([]);
                      setCurrentPage(1);
                    }}
                    className="sm:hidden w-full mt-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Products/Services Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {activeTab === 'products' ? 'Products' : 'Services'}
              {products.length > 0 && (
                <span className="ml-2 text-base sm:text-lg font-normal text-gray-500">
                  ({products.length} {products.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-initial rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="default">Default</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-a-z">Name: A to Z</option>
                <option value="name-z-a">Name: Z to A</option>
              </select>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="text-center py-12 sm:py-16">
              <div className="inline-block h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-500 text-sm sm:text-base">Loading {activeTab === 'products' ? 'products' : 'services'}...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-4 text-gray-500 text-sm sm:text-base">No products found. Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
                {sortProducts(products).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={() => {
                      if (user) {
                        router.push(`/products/${product.id}`);
                      } else {
                        router.push(`/auth/login?returnUrl=${encodeURIComponent(`/products/${product.id}`)}`);
                      }
                    }}
                  />
                ))}
              </div>

              {/* Pagination - Mobile Optimized */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                      }}
                      disabled={currentPage === 1}
                      className="min-w-[80px] sm:min-w-[100px]"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                      }}
                      disabled={currentPage === totalPages}
                      className="min-w-[80px] sm:min-w-[100px]"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
}
