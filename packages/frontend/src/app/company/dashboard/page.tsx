'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiGet, getMainCategories, getSubcategories, getMainServiceCategories, getServiceSubcategories, ProductCategory, ServiceCategory } from '@/lib/api';
import { getTenantStatistics } from '@/lib/tenantAdminApi';
import Link from 'next/link';
import { ProductImageCarousel } from '@/components/ProductImageCarousel';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AIQuoteChat } from '@/components/AIQuoteChat';
import { Search as SearchIcon, Filter, X, ChevronDown, Package, Zap } from 'lucide-react';

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

interface SupplierInfo {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
}

interface ProductImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export default function CompanyDashboardPage() {
  return (
    <ProtectedRoute requireTenantType="company">
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // Redirect to landing page if user is not authorized (wrong tenant type or not a company)
  useEffect(() => {
    if (!loading) {
      if (!user || user.tenant?.type !== 'company') {
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
  if (!user || user.tenant?.type !== 'company') {
    return null;
  }

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [supplierInfo, setSupplierInfo] = useState<Map<string, SupplierInfo>>(new Map());
  const [isLoadingSupplier, setIsLoadingSupplier] = useState<Map<string, boolean>>(new Map());
  const [productImages, setProductImages] = useState<Map<string, ProductImage[]>>(new Map());
  const [isLoadingImages, setIsLoadingImages] = useState<Map<string, boolean>>(new Map());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  
  // Product listing and filtering
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<SearchProduct[]>([]);
  const [filters, setFilters] = useState({
    supplierId: '',
    category: '',
    serviceCategoryId: '',
    search: '',
  });
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([]);
  const [serviceProviders, setServiceProviders] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [mainCategories, setMainCategories] = useState<ProductCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ProductCategory[]>([]);
  const [mainServiceCategories, setMainServiceCategories] = useState<ServiceCategory[]>([]);
  const [subServiceCategories, setSubServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 20;
  
  // Searchable dropdown states
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  
  // Pending user count for admin notification
  const [pendingUserCount, setPendingUserCount] = useState<number>(0);
  
  // AI Quote Chat state
  const [showAIQuoteChat, setShowAIQuoteChat] = useState(false);

  // Load products with filters
  const loadProducts = useCallback(async (page = 1) => {
    setIsLoadingProducts(true);
    const params = new URLSearchParams();
    
    // Add type filter based on active tab
    params.append('type', activeTab === 'products' ? 'product' : 'service');
    
    if (filters.search) {
      params.append('q', filters.search);
    }
    if (filters.supplierId) {
      params.append('supplierId', filters.supplierId);
    }
    
    // Use appropriate category filter based on tab
    if (activeTab === 'products') {
      const categoryId = selectedSubCategoryId || selectedMainCategoryId;
      if (categoryId) {
        params.append('category', categoryId);
      }
    } else {
      const serviceCategoryId = selectedSubCategoryId || selectedMainCategoryId;
      if (serviceCategoryId) {
        params.append('serviceCategoryId', serviceCategoryId);
      }
    }
    
    params.append('page', page.toString());
    params.append('limit', productsPerPage.toString());

    try {
      const response = await apiGet<{ products: SearchProduct[]; pagination: { page: number; totalPages: number; total: number } }>(
        `/api/v1/products/search?${params.toString()}`
      );
      
      // Sort products: those with special prices first
      const sortedProducts = [...response.products].sort((a, b) => {
        const aHasSpecialPrice = a.privatePrice !== null && (a.privatePrice.price !== null || a.privatePrice.calculatedPrice !== null);
        const bHasSpecialPrice = b.privatePrice !== null && (b.privatePrice.price !== null || b.privatePrice.calculatedPrice !== null);
        
        if (aHasSpecialPrice && !bHasSpecialPrice) return -1;
        if (!aHasSpecialPrice && bHasSpecialPrice) return 1;
        return 0; // Keep original order if both have or both don't have special prices
      });
      
      setAllProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotalProducts(response.pagination.total || filteredProducts.length);
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
  }, [filters.search, filters.supplierId, activeTab, selectedMainCategoryId, selectedSubCategoryId]);

  // Load suppliers, service providers, and categories on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load suppliers
        const suppliersResponse = await apiGet<{ suppliers: Array<{ id: string; name: string; logoUrl: string | null }> }>('/api/v1/suppliers');
        setSuppliers(suppliersResponse.suppliers);

        // Load service providers
        const serviceProvidersResponse = await apiGet<{ suppliers: Array<{ id: string; name: string; logoUrl: string | null }> }>('/api/v1/service-providers/public');
        setServiceProviders(serviceProvidersResponse.suppliers || []);

        // Load product categories
        const mainCategoriesResponse = await getMainCategories();
        setMainCategories(mainCategoriesResponse.categories || []);

        // Load service categories
        const mainServiceCategoriesResponse = await getMainServiceCategories();
        setMainServiceCategories(mainServiceCategoriesResponse.categories || []);

        // Load legacy categories for backward compatibility
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

  // Load subcategories when main category changes
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

  const handleMainCategoryChange = async (mainCategoryId: string) => {
    setSelectedMainCategoryId(mainCategoryId);
    setSelectedSubCategoryId('');
    setCurrentPage(1);
    
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

  // Fetch pending user count for admin users
  useEffect(() => {
    const fetchPendingUserCount = async () => {
      if (user?.role !== 'company_admin') {
        return;
      }
      
      try {
        const stats = await getTenantStatistics();
        setPendingUserCount(stats.users.pending || 0);
      } catch (err) {
        console.error('Failed to fetch pending user count:', err);
        setPendingUserCount(0);
      }
    };

    fetchPendingUserCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Reset filters when tab changes (not when filters change)
  useEffect(() => {
    // Reset filters when tab changes
    setSelectedMainCategoryId('');
    setSelectedSubCategoryId('');
    setFilters(prev => ({ ...prev, supplierId: '', category: '', serviceCategoryId: '' }));
    setSubCategories([]);
    setSubServiceCategories([]);
    setCurrentPage(1);
  }, [activeTab]);

  // Load products when filters change
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

  // Fetch supplier information (phone and address)
  const fetchSupplierInfo = async (product: SearchProduct) => {
    const productKey = `${product.id}-${product.supplierId}`;
    setIsLoadingSupplier((prev) => new Map(prev).set(productKey, true));
    try {
      // Fetch supplier details including phone and address
      const response = await apiGet<{ supplier: SupplierInfo }>(
        `/api/v1/suppliers/${product.supplierId}`
      );
      
      setSupplierInfo((prev) => {
        const newMap = new Map(prev);
        newMap.set(productKey, response.supplier);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to fetch supplier info:', error);
      setSupplierInfo((prev) => {
        const newMap = new Map(prev);
        // Set with at least the name we know
        newMap.set(productKey, {
          id: product.supplierId,
          name: product.supplierName,
          phone: null,
          address: null,
          logoUrl: null,
        });
        return newMap;
      });
    } finally {
      setIsLoadingSupplier((prev) => {
        const newMap = new Map(prev);
        newMap.set(productKey, false);
        return newMap;
      });
    }
  };

  // Fetch product images
  const fetchProductImages = async (productId: string) => {
    setIsLoadingImages((prev) => new Map(prev).set(productId, true));
    try {
      const response = await apiGet<{ images: ProductImage[] }>(
        `/api/v1/products/${productId}/images`
      );
      
      setProductImages((prev) => {
        const newMap = new Map(prev);
        newMap.set(productId, response.images);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to fetch product images:', error);
      // Set empty array if fetch fails (product might not have images)
      setProductImages((prev) => {
        const newMap = new Map(prev);
        newMap.set(productId, []);
        return newMap;
      });
    } finally {
      setIsLoadingImages((prev) => {
        const newMap = new Map(prev);
        newMap.set(productId, false);
        return newMap;
      });
    }
  };

  const [selectedProductForDetails, setSelectedProductForDetails] = useState<SearchProduct | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleProductSelect = (product: SearchProduct) => {
    const productKey = `${product.id}-${product.supplierId}`;
    
    if (viewMode === 'grid') {
      // In grid view, show modal
      setSelectedProductForDetails(product);
      setShowDetailsModal(true);
      
      // Fetch supplier info if not already loaded
      if (!supplierInfo.has(productKey)) {
        fetchSupplierInfo(product);
      }
      
      // Fetch product images if not already loaded
      if (!productImages.has(product.id)) {
        fetchProductImages(product.id);
      }
    } else {
      // In list view, toggle expansion
      if (expandedProductId === productKey) {
        // Collapse
        setExpandedProductId(null);
      } else {
        // Expand
        setExpandedProductId(productKey);
        
        // Fetch supplier info if not already loaded
        if (!supplierInfo.has(productKey)) {
          fetchSupplierInfo(product);
        }
        
        // Fetch product images if not already loaded
        if (!productImages.has(product.id)) {
          fetchProductImages(product.id);
        }
      }
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Price Tracker
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">
                {user?.tenant?.name}
              </p>
            </div>
            {/* Desktop menu */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="default"
                onClick={() => setShowAIQuoteChat(true)}
                className="touch-target bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">AI Quote</span>
                <span className="md:hidden">Quote</span>
              </Button>
              <Link href="/company/quotes">
                <Button variant="outline" className="touch-target">
                  <span className="hidden md:inline">Quotes</span>
                  <span className="md:hidden">Quotes</span>
                </Button>
              </Link>
              {user?.role === 'company_admin' && (
                <Link href="/company/users">
                  <Button variant="outline" className="relative touch-target">
                    <span className="hidden md:inline">User Management</span>
                    <span className="md:hidden">Users</span>
                    {pendingUserCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {pendingUserCount > 99 ? '99+' : pendingUserCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}
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
              <Button
                variant="default"
                onClick={() => {
                  setShowAIQuoteChat(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full touch-target justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                AI Quote
              </Button>
              <Link href="/company/quotes" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full touch-target justify-start">
                  Quotes
                </Button>
              </Link>
              {user?.role === 'company_admin' && (
                <Link href="/company/users" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full relative touch-target justify-start">
                    User Management
                    {pendingUserCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {pendingUserCount > 99 ? '99+' : pendingUserCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}
              <Button onClick={logout} variant="outline" className="w-full touch-target justify-start">
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Products vs Services Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                setSelectedMainCategoryId('');
                setSelectedSubCategoryId('');
                setFilters(prev => ({ ...prev, supplierId: '', category: '', serviceCategoryId: '' }));
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
                setFilters(prev => ({ ...prev, supplierId: '', category: '', serviceCategoryId: '' }));
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

        {/* Optimized Search & Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <form onSubmit={(e) => { e.preventDefault(); }}>
            {/* Clean Search Bar */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={`Search ${activeTab === 'products' ? 'products' : 'services'} by name...`}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 h-11 text-base border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {(filters.supplierId || selectedMainCategoryId || selectedSubCategoryId || filters.search) && (
              <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-2">
                {filters.supplierId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                    {(activeTab === 'products' ? suppliers : serviceProviders).find(s => s.id === filters.supplierId)?.name || 'Provider'}
                    <button
                      type="button"
                      onClick={() => {
                        handleFilterChange('supplierId', '');
                        setSupplierSearchQuery('');
                        setSupplierDropdownOpen(false);
                      }}
                      className="hover:bg-blue-100 rounded p-0.5 transition-colors -mr-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedMainCategoryId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-200">
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
                      className="hover:bg-indigo-100 rounded p-0.5 transition-colors -mr-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSubCategoryId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">
                    {(activeTab === 'products' ? subCategories : subServiceCategories).find(c => c.id === selectedSubCategoryId)?.name || 'Subcategory'}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubCategoryId('');
                        setCurrentPage(1);
                      }}
                      className="hover:bg-purple-100 rounded p-0.5 transition-colors -mr-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
                    Search: {filters.search}
                    <button
                      type="button"
                      onClick={() => handleFilterChange('search', '')}
                      className="hover:bg-gray-200 rounded p-0.5 transition-colors -mr-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ supplierId: '', category: '', serviceCategoryId: '', search: '' });
                    setSelectedMainCategoryId('');
                    setSelectedSubCategoryId('');
                    setSubCategories([]);
                    setSubServiceCategories([]);
                    setSupplierSearchQuery('');
                    setCategorySearchQuery('');
                    setSupplierDropdownOpen(false);
                    setCategoryDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                  className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Simplified Filter Section */}
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Supplier/Service Provider Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {activeTab === 'products' ? 'Supplier' : 'Service Provider'}
                  </label>
                  <div className="relative supplier-dropdown-container">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search or select..."
                        value={supplierDropdownOpen ? supplierSearchQuery : (filters.supplierId ? suppliers.find(s => s.id === filters.supplierId)?.name || '' : '')}
                        onChange={(e) => {
                          setSupplierSearchQuery(e.target.value);
                          if (!supplierDropdownOpen) setSupplierDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setSupplierDropdownOpen(true);
                          setSupplierSearchQuery('');
                        }}
                        className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                      />
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
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
                          All {activeTab === 'products' ? 'Suppliers' : 'Service Providers'}
                        </div>
                        {(activeTab === 'products' ? suppliers : serviceProviders)
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
                        {(activeTab === 'products' ? suppliers : serviceProviders).filter(supplier =>
                          supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())
                        ).length === 0 && supplierSearchQuery && (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No {activeTab === 'products' ? 'suppliers' : 'service providers'} found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Main Category
                  </label>
                  <div className="relative">
                    <select
                      key={`main-category-${activeTab}`}
                      value={selectedMainCategoryId}
                      onChange={(e) => handleMainCategoryChange(e.target.value)}
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {(activeTab === 'products' ? mainCategories : mainServiceCategories).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Sub Category
                  </label>
                  <div className="relative">
                    <select
                      key={`sub-category-${activeTab}-${selectedMainCategoryId}`}
                      value={selectedSubCategoryId}
                      onChange={(e) => handleSubCategoryChange(e.target.value)}
                      disabled={!selectedMainCategoryId || loadingSubCategories}
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Products/Services List */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Available {activeTab === 'products' ? 'Products' : 'Services'}
              {filteredProducts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? (activeTab === 'products' ? 'product' : 'service') : (activeTab === 'products' ? 'products' : 'services')})
                </span>
              )}
            </h2>
            {/* View Toggle Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="touch-target"
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="touch-target"
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </Button>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full animate-pulse">
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-end mb-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4 mb-3" />
                    <Skeleton className="h-20 w-full mb-3 rounded-md" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                  </div>
                  <div className="p-4 pt-0 border-t border-gray-100">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 animate-in fade-in duration-500">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {filters.supplierId || filters.category || filters.search
                  ? 'No results found'
                  : `No ${activeTab === 'products' ? 'products' : 'services'} available`}
              </h3>
              <p className="mt-3 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                {filters.supplierId || filters.category || filters.search
                  ? (
                    <>
                      No {activeTab === 'products' ? 'products' : 'services'} match your filters.
                      <br />
                      <span className="text-gray-500">Try adjusting your search or filters.</span>
                    </>
                  )
                  : (
                    <>
                      {activeTab === 'products' ? 'Suppliers' : 'Service providers'} need to add {activeTab === 'products' ? 'products' : 'services'} with default prices.
                      <br />
                      <span className="text-gray-500">Check back later or contact suppliers directly.</span>
                    </>
                  )}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              {/* Grid View */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
                {filteredProducts.map((product) => {
                  const productKey = `${product.id}-${product.supplierId}`;
                  return (
                    <ProductCard
                      key={productKey}
                      product={product}
                      onViewDetails={() => handleProductSelect(product)}
                    />
                  );
                })}
              </div>

              {/* Enhanced Pagination */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                {/* Pagination Info - Always show */}
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium text-gray-900">{filteredProducts.length > 0 ? ((currentPage - 1) * productsPerPage + 1) : 0}</span> to{' '}
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
                      onClick={() => loadProducts(currentPage - 1)}
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
                            onClick={() => loadProducts(1)}
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
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        if (currentPage > 3 && totalPages > 7 && pageNum === 1) {
                          return null;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => loadProducts(pageNum)}
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
                            onClick={() => loadProducts(totalPages)}
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
                      onClick={() => loadProducts(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="min-w-[80px]"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Mobile list view */}
              <div className="md:hidden space-y-4">
                {filteredProducts.map((product) => {
                  const productKey = `${product.id}-${product.supplierId}`;
                  const isExpanded = expandedProductId === productKey;
                  const supplier = supplierInfo.get(productKey);
                  const loading = isLoadingSupplier.get(productKey) || false;

                  return (
                    <div key={productKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4">
                        {/* Product Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">{product.name}</h3>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductSelect(product)}
                            className="touch-target ml-2"
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </Button>
                        </div>

                        {/* Supplier Info */}
                        <div className="flex items-center gap-2 mb-3">
                          {product.supplierLogoUrl ? (
                            <img
                              src={product.supplierLogoUrl}
                              alt={product.supplierName}
                              className="h-6 w-6 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                              {product.supplierName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm text-gray-600">{product.supplierName}</span>
                        </div>

                        {/* Category and Unit */}
                        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                          {product.category && (
                            <span className="px-2 py-1 bg-gray-100 rounded">{product.category}</span>
                          )}
                          <span>{product.unit}</span>
                        </div>

                        {/* Pricing */}
                        <div className="mb-2">
                          {product.defaultPrice || product.privatePrice ? (
                            <div className="space-y-1">
                              {product.defaultPrice && (
                                <div className="text-sm text-gray-600">
                                  Default: {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                                </div>
                              )}
                              {product.privatePrice && (
                                <div>
                                  {product.privatePrice.discountPercentage !== null && product.privatePrice.calculatedPrice !== null ? (
                                    <>
                                      <div className="text-sm font-semibold text-green-600">
                                        Your Price: {product.privatePrice.currency} {product.privatePrice.calculatedPrice.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-green-600 font-medium">
                                        {product.privatePrice.discountPercentage.toFixed(1)}% savings
                                      </div>
                                    </>
                                  ) : product.privatePrice.price !== null ? (
                                    <>
                                      <div className="text-sm font-semibold text-green-600">
                                        Your Price: {product.privatePrice.currency} {product.privatePrice.price.toFixed(2)}
                                      </div>
                                      {product.defaultPrice && (
                                        <div className="text-xs text-green-600">
                                          {(((product.defaultPrice.price - product.privatePrice.price) / product.defaultPrice.price) * 100).toFixed(1)}% savings
                                        </div>
                                      )}
                                    </>
                                  ) : null}
                                </div>
                              )}
                              {!product.privatePrice && product.defaultPrice && (
                                <div className="text-xs text-gray-400">No special rate</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No price</span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                          {/* Product Images Section */}
                          {(isLoadingImages.get(product.id) || (productImages.get(product.id) || []).length > 0) && (
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 mb-3">Product Images</h3>
                              {isLoadingImages.get(product.id) ? (
                                <div className="text-center py-4">
                                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent"></div>
                                  <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                                </div>
                              ) : (
                                <ProductImageCarousel
                                  images={productImages.get(product.id) || []}
                                  productName={product.name}
                                />
                              )}
                            </div>
                          )}

                          {/* Product Details Section */}
                          <div className="border-t pt-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Product Details</h3>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500">Product Name</p>
                                <p className="text-sm text-gray-900 mt-1">{product.name}</p>
                              </div>
                              {product.description && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Description</p>
                                  <p className="text-sm text-gray-900 mt-1">{product.description}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Category</p>
                                  <p className="text-sm text-gray-900 mt-1">{product.category || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Unit</p>
                                  <p className="text-sm text-gray-900 mt-1">{product.unit}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Pricing</p>
                                <div className="space-y-2">
                                  {product.defaultPrice && (
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span className="text-xs text-gray-600">Default Price</span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {product.privatePrice && (
                                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                                      <div>
                                        <span className="text-xs font-medium text-green-700">Your Price</span>
                                        {product.privatePrice.discountPercentage !== null && (
                                          <span className="text-xs text-green-600 ml-1">
                                            ({product.privatePrice.discountPercentage.toFixed(1)}% discount)
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-sm font-bold text-green-700">
                                        {product.privatePrice.currency} {
                                          product.privatePrice.calculatedPrice !== null
                                            ? product.privatePrice.calculatedPrice.toFixed(2)
                                            : product.privatePrice.price !== null
                                            ? product.privatePrice.price.toFixed(2)
                                            : 'N/A'
                                        }
                                      </span>
                                    </div>
                                  )}
                                  {!product.privatePrice && product.defaultPrice && (
                                    <p className="text-xs text-gray-400">No special rate available</p>
                                  )}
                                  {!product.defaultPrice && !product.privatePrice && (
                                    <p className="text-xs text-gray-400">Price not available</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Supplier Information Section */}
                          <div className="border-t pt-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">Supplier Information</h3>
                            <p className="text-xs text-gray-500 mb-3">
                              Contact details for {product.supplierName}
                            </p>

                            {loading ? (
                              <div className="text-center py-4">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent"></div>
                                <p className="mt-2 text-xs text-gray-500">Loading supplier information...</p>
                              </div>
                            ) : supplier ? (
                              <div className="space-y-3">
                                {/* Supplier Logo and Name */}
                                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                                  {supplier.logoUrl ? (
                                    <img
                                      src={supplier.logoUrl}
                                      alt={product.supplierName}
                                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center text-base font-semibold text-gray-600">
                                      {product.supplierName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-base font-semibold text-gray-900">{product.supplierName}</h4>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    <svg className="h-4 w-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-xs font-medium text-gray-500">Phone Number</p>
                                    <p className="text-sm text-gray-900 mt-1">
                                      {supplier.phone || <span className="text-gray-400">Not available</span>}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    <svg className="h-4 w-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-xs font-medium text-gray-500">Location</p>
                                    <p className="text-sm text-gray-900 mt-1">
                                      {supplier.address || <span className="text-gray-400">Not available</span>}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                Supplier information not available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
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
                    {filteredProducts.map((product) => {
                      const productKey = `${product.id}-${product.supplierId}`;
                      const isExpanded = expandedProductId === productKey;
                      const supplier = supplierInfo.get(productKey);
                      const loading = isLoadingSupplier.get(productKey) || false;

                      return (
                        <React.Fragment key={productKey}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                {product.supplierLogoUrl ? (
                                  <img
                                    src={product.supplierLogoUrl}
                                    alt={product.supplierName}
                                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                                    onError={(e) => {
                                      // Fallback to initial if image fails to load
                                      const img = e.target as HTMLImageElement;
                                      img.style.display = 'none';
                                      const fallback = img.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 ${product.supplierLogoUrl ? 'hidden' : ''}`}
                                >
                                  {product.supplierName.charAt(0).toUpperCase()}
                                </div>
                                <span>{product.supplierName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.category || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {product.defaultPrice || product.privatePrice ? (
                                <div className="space-y-1">
                                  {/* Default Price */}
                                  {product.defaultPrice && (
                                    <div>
                                      <div className="text-sm text-gray-600">
                                        Default: {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                                      </div>
                                    </div>
                                  )}
                                  {/* Special Price */}
                                  {product.privatePrice && (
                                    <div>
                                      {product.privatePrice.discountPercentage !== null && product.privatePrice.calculatedPrice !== null ? (
                                        // Discount percentage applied
                                        <>
                                          <div className="text-sm font-semibold text-green-600">
                                            Your Price: {product.privatePrice.currency} {product.privatePrice.calculatedPrice.toFixed(2)}
                                          </div>
                                          <div className="text-xs text-green-600 font-medium">
                                            {product.privatePrice.discountPercentage.toFixed(1)}% Discount Applied
                                          </div>
                                          {product.defaultPrice && (
                                            <div className="text-xs text-green-600">
                                              {(((product.defaultPrice.price - product.privatePrice.calculatedPrice) / product.defaultPrice.price) * 100).toFixed(1)}% savings
                                            </div>
                                          )}
                                        </>
                                      ) : product.privatePrice.price !== null ? (
                                        // Fixed special price
                                        <>
                                          <div className="text-sm font-semibold text-green-600">
                                            Your Price: {product.privatePrice.currency} {product.privatePrice.price.toFixed(2)}
                                          </div>
                                          {product.defaultPrice && (
                                            <div className="text-xs text-green-600">
                                              {(((product.defaultPrice.price - product.privatePrice.price) / product.defaultPrice.price) * 100).toFixed(1)}% savings
                                            </div>
                                          )}
                                        </>
                                      ) : null}
                                    </div>
                                  )}
                                  {/* Show only default if no special price */}
                                  {!product.privatePrice && product.defaultPrice && (
                                    <div className="text-xs text-gray-400">No special rate</div>
                                  )}
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
                                className="touch-target"
                              >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${product.id}-${product.supplierId}-expanded`}>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                                  {/* Product Images Section */}
                                  {(isLoadingImages.get(product.id) || (productImages.get(product.id) || []).length > 0) && (
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Images</h3>
                                      {isLoadingImages.get(product.id) ? (
                                        <div className="text-center py-8">
                                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                                          <p className="mt-2 text-gray-500">Loading images...</p>
                                        </div>
                                      ) : (
                                        <ProductImageCarousel
                                          images={productImages.get(product.id) || []}
                                          productName={product.name}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Product Details Section */}
                                  <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Product Name</p>
                                        <p className="text-base text-gray-900 mt-1">{product.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">SKU</p>
                                        <p className="text-base text-gray-900 mt-1">{product.sku}</p>
                                      </div>
                                      {product.description && (
                                        <div className="md:col-span-2">
                                          <p className="text-sm font-medium text-gray-500">Description</p>
                                          <p className="text-base text-gray-900 mt-1">{product.description}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Category</p>
                                        <p className="text-base text-gray-900 mt-1">{product.category || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-500">Unit</p>
                                        <p className="text-base text-gray-900 mt-1">{product.unit}</p>
                                      </div>
                                      <div className="md:col-span-2">
                                        <p className="text-sm font-medium text-gray-500 mb-2">Pricing</p>
                                        <div className="space-y-2">
                                          {product.defaultPrice && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                              <span className="text-sm text-gray-600">Default Price</span>
                                              <span className="text-base font-semibold text-gray-900">
                                                {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                                              </span>
                                            </div>
                                          )}
                                          {product.privatePrice && (
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                              <div>
                                                <span className="text-sm font-medium text-green-700">Your Price</span>
                                                {product.privatePrice.discountPercentage !== null && (
                                                  <span className="text-xs text-green-600 ml-2">
                                                    ({product.privatePrice.discountPercentage.toFixed(1)}% discount)
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-base font-bold text-green-700">
                                                {product.privatePrice.currency} {
                                                  product.privatePrice.calculatedPrice !== null
                                                    ? product.privatePrice.calculatedPrice.toFixed(2)
                                                    : product.privatePrice.price !== null
                                                    ? product.privatePrice.price.toFixed(2)
                                                    : 'N/A'
                                                }
                                              </span>
                                            </div>
                                          )}
                                          {!product.privatePrice && product.defaultPrice && (
                                            <p className="text-sm text-gray-400">No special rate available</p>
                                          )}
                                          {!product.defaultPrice && !product.privatePrice && (
                                            <p className="text-sm text-gray-400">Price not available</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Supplier Information Section */}
                                  <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Supplier Information</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                      Contact details for {product.supplierName}
                                    </p>

                                    {loading ? (
                                      <div className="text-center py-8">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                                        <p className="mt-2 text-gray-500">Loading supplier information...</p>
                                      </div>
                                    ) : supplier ? (
                                      <div className="space-y-4">
                                        {/* Supplier Logo and Name */}
                                        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                                          {supplier.logoUrl ? (
                                            <img
                                              src={supplier.logoUrl}
                                              alt={product.supplierName}
                                              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                                              {product.supplierName.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div>
                                            <h4 className="text-lg font-semibold text-gray-900">{product.supplierName}</h4>
                                          </div>
                                        </div>
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                          </div>
                                          <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                            <p className="text-sm text-gray-900 mt-1">
                                              {supplier.phone || <span className="text-gray-400">Not available</span>}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                          </div>
                                          <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-500">Location</p>
                                            <p className="text-sm text-gray-900 mt-1">
                                              {supplier.address || <span className="text-gray-400">Not available</span>}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 text-gray-500">
                                        Supplier information not available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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

        {/* Product Details Modal for Grid View */}
        {showDetailsModal && selectedProductForDetails && (() => {
          const productKey = `${selectedProductForDetails.id}-${selectedProductForDetails.supplierId}`;
          const supplier = supplierInfo.get(productKey);
          const loading = isLoadingSupplier.get(productKey) || false;
          const images = productImages.get(selectedProductForDetails.id) || [];
          const isLoadingImgs = isLoadingImages.get(selectedProductForDetails.id) || false;

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedProductForDetails(null);
                    }}
                    className="touch-target"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <div className="p-6 space-y-6">
                  {/* Product Images Section */}
                  {(isLoadingImgs || images.length > 0) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Images</h3>
                      {isLoadingImgs ? (
                        <div className="text-center py-8">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                          <p className="mt-2 text-gray-500">Loading images...</p>
                        </div>
                      ) : (
                        <ProductImageCarousel
                          images={images}
                          productName={selectedProductForDetails.name}
                        />
                      )}
                    </div>
                  )}

                  {/* Product Details Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Product Name</p>
                        <p className="text-base text-gray-900 mt-1">{selectedProductForDetails.name}</p>
                      </div>
                      {selectedProductForDetails.description && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-500">Description</p>
                          <p className="text-base text-gray-900 mt-1">{selectedProductForDetails.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Category</p>
                        <p className="text-base text-gray-900 mt-1">{selectedProductForDetails.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Unit</p>
                        <p className="text-base text-gray-900 mt-1">{selectedProductForDetails.unit}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-500 mb-2">Pricing</p>
                        <div className="space-y-2">
                          {selectedProductForDetails.defaultPrice && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600">Default Price</span>
                              <span className="text-base font-semibold text-gray-900">
                                {selectedProductForDetails.defaultPrice.currency} {selectedProductForDetails.defaultPrice.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {selectedProductForDetails.privatePrice && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div>
                                <span className="text-sm font-medium text-green-700">Your Price</span>
                                {selectedProductForDetails.privatePrice.discountPercentage !== null && (
                                  <span className="text-xs text-green-600 ml-2">
                                    ({selectedProductForDetails.privatePrice.discountPercentage.toFixed(1)}% discount)
                                  </span>
                                )}
                              </div>
                              <span className="text-base font-bold text-green-700">
                                {selectedProductForDetails.privatePrice.currency} {
                                  selectedProductForDetails.privatePrice.calculatedPrice !== null
                                    ? selectedProductForDetails.privatePrice.calculatedPrice.toFixed(2)
                                    : selectedProductForDetails.privatePrice.price !== null
                                    ? selectedProductForDetails.privatePrice.price.toFixed(2)
                                    : 'N/A'
                                }
                              </span>
                            </div>
                          )}
                          {!selectedProductForDetails.privatePrice && selectedProductForDetails.defaultPrice && (
                            <p className="text-sm text-gray-400">No special rate available</p>
                          )}
                          {!selectedProductForDetails.defaultPrice && !selectedProductForDetails.privatePrice && (
                            <p className="text-sm text-gray-400">Price not available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Information Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Supplier Information</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Contact details for {selectedProductForDetails.supplierName}
                    </p>

                    {loading ? (
                      <div className="text-center py-8">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading supplier information...</p>
                      </div>
                    ) : supplier ? (
                      <div className="space-y-4">
                        {/* Supplier Logo and Name */}
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                          {supplier.logoUrl ? (
                            <img
                              src={supplier.logoUrl}
                              alt={selectedProductForDetails.supplierName}
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                              {selectedProductForDetails.supplierName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{selectedProductForDetails.supplierName}</h4>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Phone Number</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {supplier.phone || <span className="text-gray-400">Not available</span>}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Location</p>
                            <p className="text-sm text-gray-900 mt-1">
                              {supplier.address || <span className="text-gray-400">Not available</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Supplier information not available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </main>

      {/* AI Quote Chat Modal */}
      {showAIQuoteChat && (
        <AIQuoteChat onClose={() => setShowAIQuoteChat(false)} />
      )}
    </div>
  );
}


