'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

interface PublicProduct {
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

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; logoUrl: string | null }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 20;

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect to appropriate dashboard (except customers who stay on landing page)
      if (user.role === 'super_admin') {
        router.push('/admin/dashboard');
        return;
      }
      if (user.role !== 'customer' && user.tenant) {
        const dashboardPath =
          user.tenant.type === 'supplier'
            ? '/supplier/dashboard'
            : '/company/dashboard';
        router.push(dashboardPath);
        return;
      }
    }
    // Customers and guests stay on landing page
    loadProducts();
    loadCategories();
    loadSuppliers();
  }, [authLoading, user, router, currentPage, searchQuery, selectedCategory, selectedSupplier]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (selectedSupplier) {
        params.append('supplierId', selectedSupplier);
      }
      params.append('page', currentPage.toString());
      params.append('limit', productsPerPage.toString());

      const response = await apiGet<{ products: PublicProduct[]; pagination: { page: number; totalPages: number; total: number } }>(
        `/api/v1/products/public?${params.toString()}`
      );

      setProducts(response.products);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiGet<{ categories: string[] }>('/api/v1/products/public/categories');
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await apiGet<{ suppliers: Array<{ id: string; name: string; logoUrl: string | null }> }>('/api/v1/suppliers/public');
      setSuppliers(response.suppliers);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    setCurrentPage(1);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Construction Pricing Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    {user.firstName} {user.lastName}
                  </span>
                  {user.role === 'customer' ? (
                    <Button variant="outline" onClick={() => router.push('/auth/logout')}>
                      Logout
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => {
                      if (user.role === 'super_admin') {
                        router.push('/admin/dashboard');
                      } else if (user.tenant?.type === 'supplier') {
                        router.push('/supplier/dashboard');
                      } else {
                        router.push('/company/dashboard');
                      }
                    }}>
                      Dashboard
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button>Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Products Grid */}
        {isLoadingProducts ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={() => {
                    // For now, just show an alert. You can add a modal or detail page later
                    alert(`Product: ${product.name}\nSKU: ${product.sku}\nPrice: ${product.currency} ${product.price?.toFixed(2) || 'N/A'}`);
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(currentPage - 1);
                    }}
                    disabled={currentPage === 1}
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
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
