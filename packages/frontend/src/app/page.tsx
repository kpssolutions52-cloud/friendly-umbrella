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
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Filter, X, ChevronDown, Search as SearchIcon } from 'lucide-react';

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
  ratePerHour?: number | null;
  rateType?: 'per_hour' | 'per_project' | 'fixed' | 'negotiable' | null;
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
  const [totalProducts, setTotalProducts] = useState(0);
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
      setTotalProducts(response.pagination.total || 0);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16 sm:pb-0 flex flex-col">
      {/* Modern Header with Logo */}
      <Header />

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
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
                setSubCategories([]);
                setSubServiceCategories([]);
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
                setSubCategories([]);
                setSubServiceCategories([]);
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
        {/* Advanced Modern Search & Filter Bar */}
        <div id="mobile-search-trigger" className="sticky top-16 sm:top-0 sm:relative z-30 mb-6">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-xl shadow-lg border border-gray-200/50 backdrop-blur-sm">
            <form onSubmit={handleSearch}>
              {/* Enhanced Search Bar */}
              <div className="p-4 sm:p-5 border-b border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
                    <Input
                      id="mobile-search-input"
                      type="text"
                      placeholder={activeTab === 'products' ? 'Search products by name, SKU, or category...' : 'Search services by name or category...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white/80 backdrop-blur-sm focus:bg-white transition-all shadow-sm hover:border-gray-300 relative z-10"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Filter Toggle - Mobile Only */}
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`sm:hidden p-3 rounded-lg transition-all shadow-sm ${
                      showFilters || selectedMainCategoryId || selectedSubCategoryId || selectedSupplier
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                    aria-label="Toggle filters"
                  >
                    <Filter className="w-5 h-5" />
                    {(selectedMainCategoryId || selectedSubCategoryId || selectedSupplier) && !showFilters && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Filters - Enhanced Chips */}
              {(selectedMainCategoryId || selectedSubCategoryId || selectedSupplier || searchQuery) && (
                <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-gray-50/80 to-blue-50/30 border-b border-gray-200/50 flex flex-wrap items-center gap-2">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold border border-blue-200 shadow-sm">
                      <SearchIcon className="w-3 h-3" />
                      {searchQuery}
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="hover:bg-blue-200 rounded p-0.5 transition-colors -mr-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedMainCategoryId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold border border-indigo-200 shadow-sm">
                      <Filter className="w-3 h-3" />
                      {(activeTab === 'products' ? mainCategories : mainServiceCategories).find(c => c.id === selectedMainCategoryId)?.name || 'Category'}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMainCategoryId('');
                          setSelectedSubCategoryId('');
                          setSubCategories([]);
                          setSubServiceCategories([]);
                          setCurrentPage(1);
                        }}
                        className="hover:bg-indigo-200 rounded p-0.5 transition-colors -mr-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedSubCategoryId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold border border-purple-200 shadow-sm">
                      <Filter className="w-3 h-3" />
                      {(activeTab === 'products' ? subCategories : subServiceCategories).find(c => c.id === selectedSubCategoryId)?.name || 'Subcategory'}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubCategoryId('');
                          setCurrentPage(1);
                        }}
                        className="hover:bg-purple-200 rounded p-0.5 transition-colors -mr-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedSupplier && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 shadow-sm">
                      <Filter className="w-3 h-3" />
                      {(activeTab === 'products' ? suppliers : serviceProviders).find(p => p.id === selectedSupplier)?.name || 'Provider'}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSupplier('');
                          setCurrentPage(1);
                        }}
                        className="hover:bg-amber-200 rounded p-0.5 transition-colors -mr-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedMainCategoryId('');
                      setSelectedSubCategoryId('');
                      setSelectedSupplier('');
                      setSubCategories([]);
                      setSubServiceCategories([]);
                      setCurrentPage(1);
                    }}
                    className="ml-auto px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white rounded-lg border border-gray-200 shadow-sm transition-all"
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              {/* Advanced Filter Section */}
              <div
                className={`${
                  showFilters ? 'block' : 'hidden'
                } sm:block p-4 sm:p-5 bg-white/50 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Main Category */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Main Category
                    </label>
                    <div className="relative group">
                      <select
                        key={`main-category-${activeTab}`}
                        value={selectedMainCategoryId}
                        onChange={(e) => handleMainCategoryChange(e.target.value)}
                        className="w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer hover:border-gray-300 shadow-sm"
                      >
                        <option value="">All Categories</option>
                        {(activeTab === 'products' ? mainCategories : mainServiceCategories).map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>

                  {/* Sub Category */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      Sub Category
                    </label>
                    <div className="relative group">
                      <select
                        key={`sub-category-${activeTab}-${selectedMainCategoryId}`}
                        value={selectedSubCategoryId}
                        onChange={(e) => handleSubCategoryChange(e.target.value)}
                        disabled={!selectedMainCategoryId || loadingSubCategories}
                        className="w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm font-medium text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer hover:border-gray-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200"
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
                      <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>

                  {/* Supplier/Service Provider */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {activeTab === 'products' ? 'Supplier' : 'Service Provider'}
                    </label>
                    <div className="relative group">
                      <select
                        key={`supplier-${activeTab}`}
                        value={selectedSupplier}
                        onChange={(e) => handleSupplierChange(e.target.value)}
                        className="w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm font-medium text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer hover:border-gray-300 shadow-sm"
                      >
                        <option value="">All {activeTab === 'products' ? 'Suppliers' : 'Service Providers'}</option>
                        {(activeTab === 'products' ? suppliers : serviceProviders).map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
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

              {/* Enhanced Pagination */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                {/* Pagination Info - Always show */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium text-gray-900">{products.length > 0 ? ((currentPage - 1) * productsPerPage + 1) : 0}</span> to{' '}
                  <span className="font-medium text-gray-900">{Math.min(currentPage * productsPerPage, totalProducts)}</span> of{' '}
                  <span className="font-medium text-gray-900">{totalProducts}</span> {activeTab === 'products' ? 'products' : 'services'}
                  {totalPages > 1 && (
                    <span className="ml-2 text-gray-500">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </div>

                {/* Pagination Controls - Only show when multiple pages */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                      }}
                      disabled={currentPage === 1}
                      className="min-w-[80px]"
                    >
                      Previous
                    </Button>

                    {/* Page Numbers with Ellipsis */}
                    <div className="flex items-center gap-1">
                      {/* Always show first page */}
                      {currentPage > 3 && totalPages > 7 && (
                        <>
                          <Button
                            variant={currentPage === 1 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(1);
                            }}
                            className="min-w-[40px]"
                          >
                            1
                          </Button>
                          {currentPage > 4 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                        </>
                      )}

                      {/* Dynamic page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          // Show all pages if 7 or fewer
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // Show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // Show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Show 2 pages before and after current
                          pageNum = currentPage - 2 + i;
                        }

                        // Skip if already shown (first page)
                        if (currentPage > 3 && totalPages > 7 && pageNum === 1) {
                          return null;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(pageNum);
                            }}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      {/* Show ellipsis and last page if needed */}
                      {currentPage < totalPages - 3 && totalPages > 7 && (
                        <>
                          {currentPage < totalPages - 4 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === totalPages ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(totalPages);
                            }}
                            className="min-w-[40px]"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                      }}
                      disabled={currentPage === totalPages}
                      className="min-w-[80px]"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer with Powered By */}
      <Footer />

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
}
