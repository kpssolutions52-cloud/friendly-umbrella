'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiPost, apiGet, apiPut, apiDelete, getMainServiceCategories, getServiceSubcategories, ServiceCategory } from '@/lib/api';
import { getTenantStatistics } from '@/lib/tenantAdminApi';
import { ProductImageManager } from '@/components/ProductImageManager';
import Link from 'next/link';

export default function ServiceProviderDashboardPage() {
  return (
    <ProtectedRoute requireTenantType="service_provider">
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
  serviceCategoryId: string | null;
  serviceCategory: {
    id: string;
    name: string;
    parent?: {
      id: string;
      name: string;
    } | null;
  } | null;
  unit: string;
  ratePerHour: number | null;
  rateType: 'per_hour' | 'per_project' | 'fixed' | 'negotiable' | null;
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
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // Redirect to landing page if user is not authorized (wrong tenant type or not a service provider)
  useEffect(() => {
    if (!loading) {
      if (!user || user.tenant?.type !== 'service_provider') {
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
  if (!user || user.tenant?.type !== 'service_provider') {
    return null;
  }
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 10;
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    serviceCategoryId: '',
    mainCategoryId: '',
    unit: '',
    defaultPrice: '',
    currency: 'USD',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingUserCount, setPendingUserCount] = useState<number>(0);
  
  // Special prices for new service
  interface SpecialPriceEntry {
    id: string; // temporary id for React key
    companyId: string;
    companyName?: string; // For display in table
    priceType: 'price' | 'discount'; // 'price' for fixed price, 'discount' for discount percentage
    price: string;
    discountPercentage: string;
    currency: string;
    notes: string;
  }
  
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [mainCategories, setMainCategories] = useState<ServiceCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ServiceCategory[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [draftSpecialPrice, setDraftSpecialPrice] = useState<SpecialPriceEntry | null>(null);
  const [includedSpecialPrices, setIncludedSpecialPrices] = useState<SpecialPriceEntry[]>([]);
  const [editingSpecialPriceId, setEditingSpecialPriceId] = useState<string | null>(null);
  
  // Edit modal special prices (using same draft/included pattern)
  const [editDraftSpecialPrice, setEditDraftSpecialPrice] = useState<SpecialPriceEntry | null>(null);
  const [editIncludedSpecialPrices, setEditIncludedSpecialPrices] = useState<SpecialPriceEntry[]>([]);
  const [editingEditSpecialPriceId, setEditingEditSpecialPriceId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await apiGet<ProductStats>('/api/v1/services/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch pending user count for admin users
  const fetchPendingUserCount = async () => {
    if (user?.role !== 'service_provider_admin') {
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

  useEffect(() => {
    fetchStats();
    fetchPendingUserCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh pending user count when user changes or when returning to dashboard
  useEffect(() => {
    if (user?.role === 'service_provider_admin') {
      fetchPendingUserCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const fetchProducts = async (filter: FilterType, page = 1) => {
    if (!filter) {
      setProducts([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalProducts(0);
      return;
    }

    setIsLoadingProducts(true);
    try {
      let endpoint = '/api/v1/products';
      const params = new URLSearchParams();
      
      // Filter by service type
      params.append('type', 'service');

      if (filter === 'all') {
        params.append('includeInactive', 'true');
      } else if (filter === 'active') {
        params.append('includeInactive', 'false');
      }

      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', productsPerPage.toString());

      const response = await apiGet<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
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
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotalProducts(response.pagination.total);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setProducts([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalProducts(0);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleCardClick = (filter: FilterType) => {
    if (activeFilter === filter) {
      // If clicking the same card, close the list
      setActiveFilter(null);
      setProducts([]);
      setSearchQuery('');
      setCurrentPage(1);
      setTotalPages(1);
      setTotalProducts(0);
    } else {
      // Reset to first page when changing filter
      setCurrentPage(1);
      setSearchQuery(''); // Clear search when changing filter
      setActiveFilter(filter);
      fetchProducts(filter, 1);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If main category is selected, load subcategories
    if (name === 'mainCategoryId') {
      setSelectedMainCategoryId(value);
      // Reset subcategory when main category changes
      setFormData((prev) => ({ ...prev, mainCategoryId: value, serviceCategoryId: '' }));
      // Load subcategories for the selected main category
      if (value) {
        await loadSubCategories(value);
      } else {
        // If main category is cleared, clear subcategories
        setSubCategories([]);
      }
      setError(null);
      return;
    }
    
    // For all other fields, update normally
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Load companies when modal opens
  useEffect(() => {
    if (showAddProductModal || showEditProductModal) {
      loadCompanies();
      loadCategories();
    }
  }, [showAddProductModal, showEditProductModal]);

  // Reload subcategories when main category changes (backup mechanism)
  useEffect(() => {
    if (selectedMainCategoryId && (showAddProductModal || showEditProductModal)) {
      loadSubCategories(selectedMainCategoryId);
    } else if (!selectedMainCategoryId && (showAddProductModal || showEditProductModal)) {
      setSubCategories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMainCategoryId, showAddProductModal, showEditProductModal]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      // Get only main service categories using the dedicated endpoint
      const data = await getMainServiceCategories();
      setMainCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch service categories:', err);
      setMainCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubCategories = async (parentId: string) => {
    if (!parentId) {
      setSubCategories([]);
      return;
    }

    try {
      setLoadingSubCategories(true);
      const data = await getServiceSubcategories(parentId);
      setSubCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch service subcategories:', err);
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await apiGet<{ companies: Array<{ id: string; name: string; email: string }> }>('/api/v1/companies');
      setCompanies(response.companies || []);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
      setError('Failed to load companies list');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleAddSpecialPrice = () => {
    const newEntry: SpecialPriceEntry = {
      id: `draft-${Date.now()}-${Math.random()}`,
      companyId: '',
      priceType: 'price', // Default to price
      price: '',
      discountPercentage: '',
      currency: formData.currency || 'USD',
      notes: '',
    };
    setDraftSpecialPrice(newEntry);
    setEditingSpecialPriceId(null);
  };

  const handleIncludeSpecialPrice = () => {
    if (!draftSpecialPrice) return;
    
    // Validate draft
    if (!draftSpecialPrice.companyId) {
      setError('Please select a company');
      return;
    }
    
    if (draftSpecialPrice.priceType === 'price') {
      if (!draftSpecialPrice.price || parseFloat(draftSpecialPrice.price) <= 0) {
        setError('Please enter a valid special price');
        return;
      }
    } else {
      if (!draftSpecialPrice.discountPercentage || 
          parseFloat(draftSpecialPrice.discountPercentage) < 0 || 
          parseFloat(draftSpecialPrice.discountPercentage) > 100) {
        setError('Please enter a valid discount percentage (0-100)');
        return;
      }
    }
    
    // Check if company already exists in included prices
    const existingIndex = includedSpecialPrices.findIndex(sp => sp.companyId === draftSpecialPrice.companyId);
    if (existingIndex >= 0) {
      setError('This company already has a special price. Please edit or remove it first.');
      return;
    }
    
    // Get company name for display
    const company = companies.find(c => c.id === draftSpecialPrice.companyId);
    
    // Move draft to included prices
    const includedEntry: SpecialPriceEntry = {
      ...draftSpecialPrice,
      id: `included-${Date.now()}-${Math.random()}`,
      companyName: company?.name || '',
    };
    
    setIncludedSpecialPrices([...includedSpecialPrices, includedEntry]);
    setDraftSpecialPrice(null);
    setError(null);
  };

  const handleEditSpecialPrice = (id: string) => {
    const entry = includedSpecialPrices.find(sp => sp.id === id);
    if (entry) {
      setDraftSpecialPrice({ ...entry });
      setEditingSpecialPriceId(id);
      setIncludedSpecialPrices(includedSpecialPrices.filter(sp => sp.id !== id));
    }
  };

  const handleRemoveSpecialPrice = (id: string) => {
    setIncludedSpecialPrices(includedSpecialPrices.filter(sp => sp.id !== id));
  };

  const handleCancelDraft = () => {
    setDraftSpecialPrice(null);
    setEditingSpecialPriceId(null);
    setError(null);
  };

  const handleDraftChange = (field: keyof SpecialPriceEntry, value: string) => {
    if (!draftSpecialPrice) return;
    
    setDraftSpecialPrice({ ...draftSpecialPrice, [field]: value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Validate: if main category is selected, subcategory is required
      if (formData.mainCategoryId && !formData.serviceCategoryId) {
        setError('Please select a subcategory. Subcategory is required when a main category is selected.');
        setIsSubmitting(false);
        return;
      }

      // Validate: if subcategories exist for selected main category, one must be selected
      if (formData.mainCategoryId && subCategories.length > 0 && !formData.serviceCategoryId) {
        setError('Please select a subcategory. Subcategory is required when a main category is selected.');
        setIsSubmitting(false);
        return;
      }

      // Validate and prepare special prices (only included ones)
      const validSpecialPrices = includedSpecialPrices
        .map(sp => {
          if (sp.priceType === 'price') {
            // For fixed price: send price and currency, ensure discountPercentage is not sent
            return {
              companyId: sp.companyId,
              price: parseFloat(sp.price),
              currency: sp.currency || formData.currency || 'USD',
              discountPercentage: undefined, // Explicitly exclude discount
              notes: sp.notes || undefined,
            };
          } else {
            // For discount percentage: send discountPercentage only, ensure price is not sent
            return {
              companyId: sp.companyId,
              price: undefined, // Explicitly exclude price
              discountPercentage: parseFloat(sp.discountPercentage),
              // Don't include currency for discount percentage - it will use service default currency
              notes: sp.notes || undefined,
            };
          }
        });

      // Use subcategory (required if main category selected), otherwise use main category or undefined
      const finalServiceCategoryId = formData.serviceCategoryId || (formData.mainCategoryId && subCategories.length === 0 ? formData.mainCategoryId : undefined);
      
      const payload = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        type: 'service',
        serviceCategoryId: finalServiceCategoryId,
        unit: formData.unit,
        ratePerHour: formData.ratePerHour ? parseFloat(formData.ratePerHour) : null,
        rateType: formData.rateType || 'per_hour',
        // For services, we can still use defaultPrice for fixed pricing, but ratePerHour is primary
        defaultPrice: formData.defaultPrice ? parseFloat(formData.defaultPrice) : undefined,
        currency: formData.currency,
        specialPrices: validSpecialPrices.length > 0 ? validSpecialPrices : undefined,
      };

      const response = await apiPost<{ service: { id: string } }>('/api/v1/services', payload);
      setSuccess(true);
      
      // Refresh stats after service creation
      await fetchStats();
      
      // Reset form
      setFormData({
        sku: '',
        name: '',
        description: '',
        serviceCategoryId: '',
        mainCategoryId: '',
        unit: '',
        defaultPrice: '',
        currency: 'USD',
      });
      setSelectedMainCategoryId('');
      setSubCategories([]);
      setIncludedSpecialPrices([]);
      setDraftSpecialPrice(null);
      setEditingSpecialPriceId(null);
      
      // Close the add product modal
      setShowAddProductModal(false);
      
      // Show success message briefly, then refresh product list
      setTimeout(async () => {
        setSuccess(false);
        
        // Automatically show "All Services" list to display the newly created service
        setActiveFilter('all');
        setCurrentPage(1);
        await fetchProducts('all', 1);
      }, 1000);
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setShowAddProductModal(false);
      setShowEditProductModal(false);
      setEditingService(null);
      setError(null);
      setSuccess(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        serviceCategoryId: '',
        mainCategoryId: '',
        unit: '',
        defaultPrice: '',
        currency: 'USD',
      });
      setSelectedMainCategoryId('');
      setSubCategories([]);
      setIncludedSpecialPrices([]);
      setDraftSpecialPrice(null);
      setEditingSpecialPriceId(null);
      setEditIncludedSpecialPrices([]);
      setEditDraftSpecialPrice(null);
      setEditingEditSpecialPriceId(null);
    }
  };
  
  const handleAddEditSpecialPrice = () => {
    const newEntry: SpecialPriceEntry = {
      id: `edit-draft-${Date.now()}-${Math.random()}`,
      companyId: '',
      priceType: 'price',
      price: '',
      discountPercentage: '',
      currency: formData.currency || 'USD',
      notes: '',
    };
    setEditDraftSpecialPrice(newEntry);
    setEditingEditSpecialPriceId(null);
  };

  const handleIncludeEditSpecialPrice = () => {
    if (!editDraftSpecialPrice) return;
    
    // Validate draft
    if (!editDraftSpecialPrice.companyId) {
      setError('Please select a company');
      return;
    }
    
    if (editDraftSpecialPrice.priceType === 'price') {
      if (!editDraftSpecialPrice.price || parseFloat(editDraftSpecialPrice.price) <= 0) {
        setError('Please enter a valid special price');
        return;
      }
    } else {
      if (!editDraftSpecialPrice.discountPercentage || 
          parseFloat(editDraftSpecialPrice.discountPercentage) < 0 || 
          parseFloat(editDraftSpecialPrice.discountPercentage) > 100) {
        setError('Please enter a valid discount percentage (0-100)');
        return;
      }
    }
    
    // Check if company already exists in included prices
    const existingIndex = editIncludedSpecialPrices.findIndex(sp => sp.companyId === editDraftSpecialPrice.companyId);
    if (existingIndex >= 0 && editIncludedSpecialPrices[existingIndex].id !== editingEditSpecialPriceId) {
      setError('This company already has a special price. Please edit or remove it first.');
      return;
    }
    
    // Get company name for display
    const company = companies.find(c => c.id === editDraftSpecialPrice.companyId);
    
    // Move draft to included prices
    const includedEntry: SpecialPriceEntry = {
      ...editDraftSpecialPrice,
      id: editingEditSpecialPriceId || `edit-included-${Date.now()}-${Math.random()}`,
      companyName: company?.name || '',
    };
    
    if (editingEditSpecialPriceId) {
      // Update existing entry
      setEditIncludedSpecialPrices(editIncludedSpecialPrices.map(sp => 
        sp.id === editingEditSpecialPriceId ? includedEntry : sp
      ));
    } else {
      // Add new entry
      setEditIncludedSpecialPrices([...editIncludedSpecialPrices, includedEntry]);
    }
    
    setEditDraftSpecialPrice(null);
    setEditingEditSpecialPriceId(null);
    setError(null);
  };

  const handleEditEditSpecialPrice = (id: string) => {
    const entry = editIncludedSpecialPrices.find(sp => sp.id === id);
    if (entry) {
      setEditDraftSpecialPrice({ ...entry });
      setEditingEditSpecialPriceId(id);
    }
  };

  const handleRemoveEditSpecialPrice = (id: string) => {
    setEditIncludedSpecialPrices(editIncludedSpecialPrices.filter(sp => sp.id !== id));
  };

  const handleCancelEditDraft = () => {
    setEditDraftSpecialPrice(null);
    setEditingEditSpecialPriceId(null);
    setError(null);
  };

  const handleEditDraftChange = (field: keyof SpecialPriceEntry, value: string) => {
    if (!editDraftSpecialPrice) return;
    
    setEditDraftSpecialPrice({ ...editDraftSpecialPrice, [field]: value });
    setError(null);
  };

  const handleEditProduct = async (product: Product) => {
    try {
      // Fetch full product data with private prices
      const response = await apiGet<{ product: any }>(`/api/v1/products/${product.id}`);
      const fullProduct = response.product;
      
      // Determine main category and subcategory from product
      let mainCategoryId = '';
      let subCategoryId = '';
      
      if (fullProduct.serviceCategory) {
        if (fullProduct.serviceCategory.parent) {
          // Product has a subcategory
          mainCategoryId = fullProduct.serviceCategory.parent.id;
          subCategoryId = fullProduct.serviceCategoryId || '';
          // Load subcategories for the main category
          await loadSubCategories(mainCategoryId);
        } else {
          // Product only has a main category (no parent)
          mainCategoryId = fullProduct.serviceCategoryId || '';
          subCategoryId = '';
          // Load subcategories to check if any exist
          if (mainCategoryId) {
            await loadSubCategories(mainCategoryId);
          }
        }
      }
      
      setEditingProduct(fullProduct);
      setFormData({
        sku: fullProduct.sku,
        name: fullProduct.name,
        description: fullProduct.description || '',
        serviceCategoryId: subCategoryId,
        mainCategoryId: mainCategoryId,
        unit: fullProduct.unit,
        ratePerHour: fullProduct.ratePerHour ? fullProduct.ratePerHour.toString() : '',
        rateType: fullProduct.rateType || 'per_hour',
        defaultPrice: fullProduct.defaultPrices && fullProduct.defaultPrices.length > 0 
          ? fullProduct.defaultPrices[0].price.toString() 
          : '',
        currency: fullProduct.defaultPrices && fullProduct.defaultPrices.length > 0
          ? fullProduct.defaultPrices[0].currency
          : 'USD',
      });
      
      setSelectedMainCategoryId(mainCategoryId);
      
      // Load existing private prices into edit included special prices state
      if (fullProduct.privatePrices && fullProduct.privatePrices.length > 0) {
        // Get company names from loaded companies list
        const existingSpecialPrices: SpecialPriceEntry[] = fullProduct.privatePrices.map((pp: any) => {
          const companyInfo = companies.find(c => c.id === pp.companyId);
          // Determine pricing type: discountPercentage takes precedence if both exist
          const pricingType = (pp.discountPercentage !== null && pp.discountPercentage !== undefined) 
            ? 'discount' 
            : 'price';
          return {
            id: pp.id,
            companyId: pp.companyId,
            companyName: companyInfo?.name || 'Unknown',
            priceType: pricingType,
            // Only populate the field that matches the pricing type
            price: pricingType === 'price' && pp.price !== null && pp.price !== undefined 
              ? pp.price.toString() 
              : '',
            discountPercentage: pricingType === 'discount' && pp.discountPercentage !== null && pp.discountPercentage !== undefined 
              ? pp.discountPercentage.toString() 
              : '',
            currency: pricingType === 'price' ? (pp.currency || 'USD') : 'USD',
            notes: pp.notes || '',
          };
        });
        setEditIncludedSpecialPrices(existingSpecialPrices);
      } else {
        setEditIncludedSpecialPrices([]);
      }
      setEditDraftSpecialPrice(null);
      setEditingEditSpecialPriceId(null);
      
      setShowEditProductModal(true);
      setError(null);
      setSuccess(false);
    } catch (err: any) {
      console.error('Failed to fetch service details:', err);
      setError('Failed to load service details');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Validate: if main category is selected, subcategory is required
      if (formData.mainCategoryId && !formData.serviceCategoryId && subCategories.length > 0) {
        setError('Please select a subcategory. Subcategory is required when a main category is selected.');
        setIsSubmitting(false);
        return;
      }

      // Validate and prepare special prices for edit (only included ones)
      const validSpecialPrices = editIncludedSpecialPrices
        .map(sp => {
          if (sp.priceType === 'price') {
            // For fixed price: send price and currency, ensure discountPercentage is not sent
            return {
              companyId: sp.companyId,
              price: parseFloat(sp.price),
              currency: sp.currency || formData.currency || 'USD',
              discountPercentage: undefined, // Explicitly exclude discount
              notes: sp.notes || undefined,
            };
          } else {
            // For discount percentage: send discountPercentage only, ensure price is not sent
            return {
              companyId: sp.companyId,
              price: undefined, // Explicitly exclude price
              discountPercentage: parseFloat(sp.discountPercentage),
              notes: sp.notes || undefined,
            };
          }
        });

      // Use subcategory (required if main category selected), otherwise use main category or undefined
      const finalServiceCategoryId = formData.serviceCategoryId || (formData.mainCategoryId && subCategories.length === 0 ? formData.mainCategoryId : undefined);
      
      const payload: any = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        type: 'service',
        serviceCategoryId: finalServiceCategoryId,
        unit: formData.unit,
        specialPrices: validSpecialPrices.length > 0 ? validSpecialPrices : undefined,
      };

      // Only include price if it's provided
      if (formData.defaultPrice) {
        payload.defaultPrice = parseFloat(formData.defaultPrice);
        payload.currency = formData.currency;
      }

      await apiPut(`/api/v1/products/${editingProduct.id}`, payload);
      setSuccess(true);

      // Refresh stats and products
      await fetchStats();
      if (activeFilter) {
        await fetchProducts(activeFilter, currentPage);
      }

      setTimeout(() => {
        setShowEditProductModal(false);
        setEditingProduct(null);
        setEditIncludedSpecialPrices([]);
        setSuccess(false);
        setFormData({
          sku: '',
          name: '',
          description: '',
          serviceCategoryId: '',
          mainCategoryId: '',
          unit: '',
          ratePerHour: '',
          rateType: 'per_hour',
          defaultPrice: '',
          currency: 'USD',
        });
        setSelectedMainCategoryId('');
        setSubCategories([]);
      }, 1000);
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleInactive = async (product: Product) => {
    const newStatus = !product.isActive;
    
    // Store previous state for rollback on error
    const previousProducts = [...products];
    
    // Optimistically update UI immediately
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, isActive: newStatus } : p
      )
    );

    try {
      await apiPut(`/api/v1/products/${product.id}`, {
        isActive: newStatus,
      });

      // Refresh stats after successful update
      await fetchStats();
    } catch (err: any) {
      // Rollback on error
      setProducts(previousProducts);
      alert(err?.error?.message || 'Failed to update service status');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await apiDelete(`/api/v1/products/${productId}`);

      // Refresh stats and products
      await fetchStats();
      if (activeFilter) {
        await fetchProducts(activeFilter, currentPage);
      }

      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err?.error?.message || 'Failed to delete service');
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
                Service Provider Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">
                {user?.tenant?.name}
              </p>
            </div>
            {/* Desktop menu */}
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/service-provider/profile">
                <Button variant="outline" className="touch-target">
                  <span className="hidden md:inline">Profile</span>
                  <span className="md:hidden">Profile</span>
                </Button>
              </Link>
              {user?.role === 'service_provider_admin' && (
                <Link href="/service-provider/users">
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
              <Link href="/service-provider/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full touch-target justify-start">
                  Profile
                </Button>
              </Link>
              {user?.role === 'service_provider_admin' && (
                <Link href="/service-provider/users" onClick={() => setMobileMenuOpen(false)}>
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
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                      Total Services
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
                      Active Services
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

        {/* Service List Section */}
        {activeFilter && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeFilter === 'all' && 'All Services'}
                {activeFilter === 'active' && 'Active Services'}
                {activeFilter === 'withPrivatePrices' && 'Services with Private Prices'}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({searchQuery ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length : products.length})
                </span>
              </h2>
              <button
                onClick={() => {
                  setActiveFilter(null);
                  setProducts([]);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="Search services by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full max-w-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-500">Loading services...</p>
              </div>
            ) : (searchQuery ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : products).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? <>No services found matching &quot;{searchQuery}&quot;</> : 'No services found'}
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products
                      .filter(product => 
                        searchQuery === '' || 
                        product.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.serviceCategory ? (product.serviceCategory.parent ? `${product.serviceCategory.parent.name} > ${product.serviceCategory.name}` : product.serviceCategory.name) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.ratePerHour !== null && product.ratePerHour !== undefined ? (
                            <span>
                              {product.rateType === 'per_hour' && `${Number(product.ratePerHour).toFixed(2)}/hr`}
                              {product.rateType === 'per_project' && `${Number(product.ratePerHour).toFixed(2)}/project`}
                              {product.rateType === 'fixed' && `${formData.currency || 'USD'} ${Number(product.ratePerHour).toFixed(2)}`}
                              {product.rateType === 'negotiable' && `From ${Number(product.ratePerHour).toFixed(2)}/hr (Negotiable)`}
                              {!product.rateType && `${Number(product.ratePerHour).toFixed(2)}/hr`}
                            </span>
                          ) : (
                            <span className="text-gray-400">Rate not set</span>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 px-3 touch-target"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleInactive(product)}
                              className={`h-8 px-3 touch-target ${
                                !product.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {product.isActive ? 'Inactive' : 'Activate'}
                            </Button>
                            {user?.role === 'service_provider_admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirm(product.id)}
                                className="h-8 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 touch-target"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden space-y-4">
                  {products
                    .filter(product => 
                      searchQuery === '' || 
                      product.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                        </div>
                        <span
                          className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-1 text-gray-900">{product.serviceCategory ? (product.serviceCategory.parent ? `${product.serviceCategory.parent.name} > ${product.serviceCategory.name}` : product.serviceCategory.name) : '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit:</span>
                          <span className="ml-1 text-gray-900">{product.unit}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Rate:</span>
                          <span className="ml-1 text-gray-900 font-medium">
                            {product.ratePerHour !== null && product.ratePerHour !== undefined ? (
                              <>
                                {product.rateType === 'per_hour' && `${Number(product.ratePerHour).toFixed(2)}/hr`}
                                {product.rateType === 'per_project' && `${Number(product.ratePerHour).toFixed(2)}/project`}
                                {product.rateType === 'fixed' && `USD ${Number(product.ratePerHour).toFixed(2)}`}
                                {product.rateType === 'negotiable' && `From ${Number(product.ratePerHour).toFixed(2)}/hr (Negotiable)`}
                                {!product.rateType && `${Number(product.ratePerHour).toFixed(2)}/hr`}
                              </>
                            ) : (
                              <span className="text-gray-400">Rate not set</span>
                            )}
                          </span>
                        </div>
                        {product.description && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Description:</span>
                            <p className="text-xs text-gray-700 mt-1 line-clamp-2">{product.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                          className="w-full touch-target"
                        >
                          Edit
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleToggleInactive(product)}
                            className={`touch-target ${
                              !product.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {product.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          {user?.role === 'service_provider_admin' && (
                            <Button
                              variant="outline"
                              onClick={() => setDeleteConfirm(product.id)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 touch-target"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {products.length > 0 ? ((currentPage - 1) * productsPerPage + 1) : 0} to {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} services
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        fetchProducts(activeFilter, newPage);
                      }}
                      disabled={currentPage === 1 || isLoadingProducts}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(pageNum);
                              fetchProducts(activeFilter, pageNum);
                            }}
                            disabled={isLoadingProducts}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        fetchProducts(activeFilter, newPage);
                      }}
                      disabled={currentPage === totalPages || isLoadingProducts}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <Button onClick={() => setShowAddProductModal(true)}>Add Service</Button>
              <Button variant="outline" disabled className="opacity-60 cursor-not-allowed">Import CSV</Button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Service Modal */}
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
                <h2 className="text-2xl font-bold text-gray-900">Add New Service</h2>
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
                  Service created successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection - Moved to Top */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mainCategoryId">Main Category</Label>
                    <select
                      id="mainCategoryId"
                      name="mainCategoryId"
                      value={formData.mainCategoryId}
                      onChange={handleInputChange}
                      disabled={isSubmitting || loadingCategories}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a main category (optional)</option>
                      {mainCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="serviceCategoryId">Sub Category {formData.mainCategoryId && subCategories.length > 0 ? '*' : ''}</Label>
                    <select
                      id="serviceCategoryId"
                      name="serviceCategoryId"
                      value={formData.serviceCategoryId}
                      onChange={handleInputChange}
                      required={!!(formData.mainCategoryId && subCategories.length > 0)}
                      disabled={isSubmitting || !formData.mainCategoryId || loadingSubCategories}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {loadingSubCategories 
                          ? 'Loading subcategories...' 
                          : subCategories.length === 0 && formData.mainCategoryId
                          ? 'No subcategories available'
                          : 'Select a subcategory' + (formData.mainCategoryId && subCategories.length > 0 ? ' *' : '')
                        }
                      </option>
                      {subCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {!formData.mainCategoryId && (
                      <p className="text-xs text-gray-500 mt-1">Please select a main category first</p>
                    )}
                    {formData.mainCategoryId && subCategories.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Subcategory is required when a main category is selected</p>
                    )}
                    {formData.mainCategoryId && subCategories.length === 0 && !loadingSubCategories && (
                      <p className="text-xs text-amber-600 mt-1">No subcategories available for this main category</p>
                    )}
                  </div>
                </div>

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
                  <Label htmlFor="name">Service Name *</Label>
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
                    placeholder="Service description..."
                  />
                </div>

                {/* Service Pricing Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rateType">Pricing Type *</Label>
                    <select
                      id="rateType"
                      name="rateType"
                      value={formData.rateType}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="per_hour">Per Hour</option>
                      <option value="per_project">Per Project</option>
                      <option value="fixed">Fixed Price</option>
                      <option value="negotiable">Negotiable</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="ratePerHour">
                      {formData.rateType === 'per_hour' ? 'Rate Per Hour *' : 
                       formData.rateType === 'per_project' ? 'Rate Per Project *' : 
                       formData.rateType === 'fixed' ? 'Fixed Price *' : 
                       'Starting Rate (Optional)'}
                    </Label>
                    <Input
                      id="ratePerHour"
                      name="ratePerHour"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.ratePerHour}
                      onChange={handleInputChange}
                      required={formData.rateType !== 'negotiable'}
                      disabled={isSubmitting}
                      placeholder={formData.rateType === 'per_hour' ? '50.00' : formData.rateType === 'per_project' ? '5000.00' : '1000.00'}
                    />
                  </div>
                </div>

                {/* Optional: Currency for fixed pricing */}
                {formData.rateType === 'fixed' && (
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
                )}

                {/* Legacy defaultPrice field - hidden for services, kept for backward compatibility */}
                <div className="hidden">
                  <Label htmlFor="defaultPrice">Default Price (Legacy)</Label>
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

                {/* Special Prices Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-semibold">Special Prices (Optional)</Label>
                      <p className="text-sm text-gray-500 mt-1">Add company-specific prices for this service</p>
                    </div>
                    {!draftSpecialPrice && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSpecialPrice}
                        disabled={isSubmitting || loadingCompanies}
                      >
                        + Add Company Price
                      </Button>
                    )}
                  </div>

                  {loadingCompanies && !draftSpecialPrice && includedSpecialPrices.length === 0 && (
                    <div className="text-sm text-gray-500 py-2">Loading companies...</div>
                  )}

                  {/* Draft Form */}
                  {draftSpecialPrice && (
                    <div className="border rounded-lg p-4 bg-blue-50 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          {editingSpecialPriceId ? 'Edit Company Price' : 'Add Company Price'}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelDraft}
                          disabled={isSubmitting}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="draft-company">Company *</Label>
                          <select
                            id="draft-company"
                            value={draftSpecialPrice.companyId}
                            onChange={(e) => handleDraftChange('companyId', e.target.value)}
                            disabled={isSubmitting || loadingCompanies}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select a company</option>
                            {companies
                              .filter(company => 
                                company.id === draftSpecialPrice.companyId ||
                                !includedSpecialPrices.some(sp => sp.companyId === company.id)
                              )
                              .map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="draft-priceType">Pricing Type *</Label>
                          <select
                            id="draft-priceType"
                            value={draftSpecialPrice.priceType}
                            onChange={(e) => {
                              const newPriceType = e.target.value as 'price' | 'discount';
                              if (!draftSpecialPrice) return;
                              
                              // Update priceType and clear the opposite field in a single state update
                              if (newPriceType === 'price') {
                                setDraftSpecialPrice({
                                  ...draftSpecialPrice,
                                  priceType: 'price',
                                  discountPercentage: '',
                                });
                              } else {
                                setDraftSpecialPrice({
                                  ...draftSpecialPrice,
                                  priceType: 'discount',
                                  price: '',
                                });
                              }
                              setError(null);
                            }}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="price">Special Price</option>
                            <option value="discount">Discount %</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {draftSpecialPrice.priceType === 'price' ? (
                          <>
                            <div>
                              <Label htmlFor="draft-price">Special Price *</Label>
                              <Input
                                id="draft-price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={draftSpecialPrice.price}
                                onChange={(e) => handleDraftChange('price', e.target.value)}
                                disabled={isSubmitting}
                                placeholder="0.00"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="draft-currency">Currency</Label>
                              <select
                                id="draft-currency"
                                value={draftSpecialPrice.currency}
                                onChange={(e) => handleDraftChange('currency', e.target.value)}
                                disabled={isSubmitting}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="SGD">SGD</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <div className="md:col-span-2">
                            <Label htmlFor="draft-discount">Discount Percentage *</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="draft-discount"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={draftSpecialPrice.discountPercentage}
                                onChange={(e) => handleDraftChange('discountPercentage', e.target.value)}
                                disabled={isSubmitting}
                                placeholder="0.00"
                                required
                                className="flex-1 max-w-xs"
                              />
                              <span className="text-sm text-gray-500 whitespace-nowrap">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Discount will be calculated from the default price ({formData.currency || 'USD'})</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Label htmlFor="draft-notes">Notes (Optional)</Label>
                        <Input
                          id="draft-notes"
                          type="text"
                          value={draftSpecialPrice.notes}
                          onChange={(e) => handleDraftChange('notes', e.target.value)}
                          disabled={isSubmitting}
                          placeholder="Additional notes..."
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={handleIncludeSpecialPrice}
                          disabled={isSubmitting}
                          size="sm"
                        >
                          {editingSpecialPriceId ? 'Update' : 'Include'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Included Prices Table */}
                  {includedSpecialPrices.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Discount</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {includedSpecialPrices.map((sp) => (
                              <tr key={sp.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {sp.companyName || 'Unknown'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {sp.priceType === 'price' ? 'Special Price' : 'Discount %'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {sp.priceType === 'price' 
                                    ? parseFloat(sp.price).toFixed(2)
                                    : `${parseFloat(sp.discountPercentage).toFixed(2)}%`
                                  }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {sp.priceType === 'price' ? sp.currency : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {sp.notes || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditSpecialPrice(sp.id)}
                                      disabled={isSubmitting}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveSpecialPrice(sp.id)}
                                      disabled={isSubmitting}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {!draftSpecialPrice && includedSpecialPrices.length === 0 && !loadingCompanies && (
                    <div className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
                      No special prices included. Click &quot;Add Company Price&quot; to add one.
                    </div>
                  )}
                </div>

                {/* Service Images Section - Only show after service is created */}
                <div className="border-t pt-4 mt-4">
                  <Label className="text-base font-semibold mb-2 block">Service Images</Label>
                  <p className="text-sm text-gray-500">
                    Save the service first, then you can upload images in the edit view.
                  </p>
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
                    {isSubmitting ? 'Creating...' : 'Create Service'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditProductModal && editingProduct && (
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
                <h2 className="text-2xl font-bold text-gray-900">Edit Service</h2>
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
                  Service updated successfully!
                </div>
              )}

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                {/* Category Selection - Moved to Top */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-mainCategoryId">Main Category</Label>
                    <select
                      id="edit-mainCategoryId"
                      name="mainCategoryId"
                      value={formData.mainCategoryId}
                      onChange={handleInputChange}
                      disabled={isSubmitting || loadingCategories}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a main category (optional)</option>
                      {mainCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-serviceCategoryId">Sub Category {formData.mainCategoryId && subCategories.length > 0 ? '*' : ''}</Label>
                    <select
                      id="edit-serviceCategoryId"
                      name="serviceCategoryId"
                      value={formData.serviceCategoryId}
                      onChange={handleInputChange}
                      required={!!(formData.mainCategoryId && subCategories.length > 0)}
                      disabled={isSubmitting || !formData.mainCategoryId || loadingSubCategories}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {loadingSubCategories 
                          ? 'Loading subcategories...' 
                          : subCategories.length === 0 && formData.mainCategoryId
                          ? 'No subcategories available'
                          : 'Select a subcategory' + (formData.mainCategoryId && subCategories.length > 0 ? ' *' : '')
                        }
                      </option>
                      {subCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {!formData.mainCategoryId && (
                      <p className="text-xs text-gray-500 mt-1">Please select a main category first</p>
                    )}
                    {formData.mainCategoryId && subCategories.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Subcategory is required when a main category is selected</p>
                    )}
                    {formData.mainCategoryId && subCategories.length === 0 && !loadingSubCategories && (
                      <p className="text-xs text-amber-600 mt-1">No subcategories available for this main category</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-sku">SKU *</Label>
                    <Input
                      id="edit-sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="PROD-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-unit">Unit *</Label>
                    <Input
                      id="edit-unit"
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
                  <Label htmlFor="edit-name">Service Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Steel Beam 10x10"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Service description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-currency">Currency</Label>
                    <select
                      id="edit-currency"
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
                  <div>
                    <Label htmlFor="edit-defaultPrice">Default Price</Label>
                    <Input
                      id="edit-defaultPrice"
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
                </div>

                {/* Special Prices Section for Edit */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-semibold">Special Prices (Optional)</Label>
                      <p className="text-sm text-gray-500 mt-1">Add or update company-specific prices for this service</p>
                    </div>
                    {!editDraftSpecialPrice && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddEditSpecialPrice}
                        disabled={isSubmitting || loadingCompanies}
                      >
                        + Add Company Price
                      </Button>
                    )}
                  </div>

                  {loadingCompanies && !editDraftSpecialPrice && editIncludedSpecialPrices.length === 0 && (
                    <div className="text-sm text-gray-500 py-2">Loading companies...</div>
                  )}

                  {/* Draft Form */}
                  {editDraftSpecialPrice && (
                    <div className="border rounded-lg p-4 bg-blue-50 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          {editingEditSpecialPriceId ? 'Edit Company Price' : 'Add Company Price'}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEditDraft}
                          disabled={isSubmitting}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="edit-draft-company">Company *</Label>
                          <select
                            id="edit-draft-company"
                            value={editDraftSpecialPrice.companyId}
                            onChange={(e) => handleEditDraftChange('companyId', e.target.value)}
                            disabled={isSubmitting || loadingCompanies}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select a company</option>
                            {companies
                              .filter(company => 
                                company.id === editDraftSpecialPrice.companyId ||
                                !editIncludedSpecialPrices.some(sp => sp.companyId === company.id)
                              )
                              .map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="edit-draft-priceType">Pricing Type *</Label>
                          <select
                            id="edit-draft-priceType"
                            value={editDraftSpecialPrice.priceType}
                            onChange={(e) => {
                              const newPriceType = e.target.value as 'price' | 'discount';
                              if (!editDraftSpecialPrice) return;
                              
                              // Update priceType and clear the opposite field in a single state update
                              if (newPriceType === 'price') {
                                setEditDraftSpecialPrice({
                                  ...editDraftSpecialPrice,
                                  priceType: 'price',
                                  discountPercentage: '',
                                });
                              } else {
                                setEditDraftSpecialPrice({
                                  ...editDraftSpecialPrice,
                                  priceType: 'discount',
                                  price: '',
                                });
                              }
                              setError(null);
                            }}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="price">Special Price</option>
                            <option value="discount">Discount %</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {editDraftSpecialPrice.priceType === 'price' ? (
                          <>
                            <div>
                              <Label htmlFor="edit-draft-price">Special Price *</Label>
                              <Input
                                id="edit-draft-price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editDraftSpecialPrice.price}
                                onChange={(e) => handleEditDraftChange('price', e.target.value)}
                                disabled={isSubmitting}
                                placeholder="0.00"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-draft-currency">Currency</Label>
                              <select
                                id="edit-draft-currency"
                                value={editDraftSpecialPrice.currency}
                                onChange={(e) => handleEditDraftChange('currency', e.target.value)}
                                disabled={isSubmitting}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="SGD">SGD</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <div className="md:col-span-2">
                            <Label htmlFor="edit-draft-discount">Discount Percentage *</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="edit-draft-discount"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={editDraftSpecialPrice.discountPercentage}
                                onChange={(e) => handleEditDraftChange('discountPercentage', e.target.value)}
                                disabled={isSubmitting}
                                placeholder="0.00"
                                required
                                className="flex-1 max-w-xs"
                              />
                              <span className="text-sm text-gray-500 whitespace-nowrap">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Discount will be calculated from the default price ({formData.currency || 'USD'})</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Label htmlFor="edit-draft-notes">Notes (Optional)</Label>
                        <Input
                          id="edit-draft-notes"
                          type="text"
                          value={editDraftSpecialPrice.notes}
                          onChange={(e) => handleEditDraftChange('notes', e.target.value)}
                          disabled={isSubmitting}
                          placeholder="Additional notes..."
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={handleIncludeEditSpecialPrice}
                          disabled={isSubmitting}
                          size="sm"
                        >
                          {editingEditSpecialPriceId ? 'Update' : 'Include'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Included Prices Table */}
                  {editIncludedSpecialPrices.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Discount</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {editIncludedSpecialPrices.map((sp) => (
                              <tr key={sp.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {sp.companyName || 'Unknown'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {sp.priceType === 'price' ? 'Special Price' : 'Discount %'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {sp.priceType === 'price' 
                                    ? parseFloat(sp.price).toFixed(2)
                                    : `${parseFloat(sp.discountPercentage).toFixed(2)}%`
                                  }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {sp.priceType === 'price' ? sp.currency : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {sp.notes || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditEditSpecialPrice(sp.id)}
                                      disabled={isSubmitting}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveEditSpecialPrice(sp.id)}
                                      disabled={isSubmitting}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {!editDraftSpecialPrice && editIncludedSpecialPrices.length === 0 && !loadingCompanies && (
                    <div className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
                      No special prices included. Click &quot;Add Company Price&quot; to add one.
                    </div>
                  )}
                </div>

                {/* Service Images Section */}
                <ProductImageManager
                  productId={editingProduct?.id || null}
                  disabled={isSubmitting}
                />

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
                    {isSubmitting ? 'Updating...' : 'Update Service'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Service</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteProduct(deleteConfirm)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


