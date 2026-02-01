'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Plus, Edit2, Trash2, Loader2, Search, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Redirect if not authenticated or not supplier
  // Check both new schema (type) and old schema (tenant.type) for compatibility
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.type !== 'supplier' && user?.tenant?.type !== 'supplier') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Load products
  // Check both new schema (type) and old schema (tenant.type) for compatibility
  useEffect(() => {
    if (isAuthenticated && (user?.type === 'supplier' || user?.tenant?.type === 'supplier')) {
      loadProducts();
    }
  }, [isAuthenticated, user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Note: This endpoint needs to be created in the backend
      // For now, we'll use a placeholder
      const response = await apiGet<{ products: Product[] }>(
        '/api/v1/products?supplier=true'
      );
      setProducts(response.products || []);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      // For MVP 1, if endpoint doesn't exist, show empty state
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', price: '', unit: '' });
    setEditingProduct(null);
    setShowAddForm(true);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit,
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.unit) {
      return;
    }

    try {
      setSubmitting(true);
      if (editingProduct) {
        // Update existing product
        await apiPut(`/api/v1/products/${editingProduct.id}`, {
          name: formData.name,
          price: parseFloat(formData.price),
          unit: formData.unit,
        });
      } else {
        // Create new product
        await apiPost('/api/v1/products', {
          name: formData.name,
          price: parseFloat(formData.price),
          unit: formData.unit,
        });
      }
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', unit: '' });
      loadProducts();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      alert(error?.error?.message || 'Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await apiDelete(`/api/v1/products/${productId}`);
      loadProducts();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      alert(error?.error?.message || 'Failed to delete product. Please try again.');
    }
  };

  // Filtered and sorted products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.unit.toLowerCase().includes(query) ||
          product.price.toString().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: 'name' | 'price' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'price' | 'updatedAt' }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
    );
  };

  // Check both new schema (type) and old schema (tenant.type) for compatibility
  if (!isAuthenticated || (user?.type !== 'supplier' && user?.tenant?.type !== 'supplier')) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                Inventory Manager
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {products.length} product{products.length !== 1 ? 's' : ''} in inventory
              </p>
            </div>
            <Button 
              onClick={handleAdd} 
              className="flex items-center gap-2 w-full sm:w-auto touch-target bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products by name, price, or unit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 touch-target"
                  />
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex gap-2">
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50">
                  <span className="text-xs text-gray-600 whitespace-nowrap">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'updatedAt')}
                    className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="updatedAt">Last Updated</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none border-0"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results count */}
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500">
                Showing {filteredAndSortedProducts.length} of {products.length} products
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Cement"
                  className="mt-1 touch-target"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="price" className="text-sm">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    placeholder="48.00"
                    className="mt-1 touch-target"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="text-sm">Unit *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    required
                    placeholder="e.g., bag, ton, kg"
                    className="mt-1 touch-target"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full sm:w-auto touch-target"
                  size="sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </span>
                      <span className="sm:hidden">
                        {editingProduct ? 'Update' : 'Add'}
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    setFormData({ name: '', price: '', unit: '' });
                  }}
                  className="w-full sm:w-auto touch-target"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Products Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-sm sm:text-base text-gray-500 mt-2">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-sm sm:text-base text-gray-500 mb-4">No products yet.</p>
            <Button onClick={handleAdd} className="touch-target bg-green-600 hover:bg-green-700" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-sm sm:text-base text-gray-500 mb-2">No products match your search.</p>
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')} 
              className="touch-target" 
              size="sm"
            >
              Clear Search
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            {/* Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-semibold text-gray-900 flex-1 pr-2">
                      {product.name}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="h-8 w-8 p-0 hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">/{product.unit}</span>
                    </div>
                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                      Updated: {new Date(product.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* List/Table View */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Product Name
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center">
                        Price
                        <SortIcon field="price" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('updatedAt')}
                    >
                      <div className="flex items-center">
                        Last Updated
                        <SortIcon field="updatedAt" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${product.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{product.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
