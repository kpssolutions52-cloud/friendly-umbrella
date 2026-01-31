'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
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
    // For MVP 1, redirect suppliers to chat page by default
    // The Products page is accessible via header button, but default landing should be chat
    // Check if user came directly to this page (not from navigation)
    const referrer = document.referrer;
    const isDirectAccess = !referrer || referrer.includes('/supplier/products') || referrer === window.location.href;
    if (isDirectAccess && !sessionStorage.getItem('supplier-products-accessed')) {
      // User came directly to this page, redirect to chat
      router.push('/supplier/chat');
      return;
    }
    // Mark that user has accessed products page (so they can navigate back)
    sessionStorage.setItem('supplier-products-accessed', 'true');
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Manage your product inventory and prices
              </p>
            </div>
            <Button 
              onClick={handleAdd} 
              className="flex items-center gap-2 w-full sm:w-auto touch-target"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

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

        {/* Products List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-sm sm:text-base text-gray-500 mt-2">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <p className="text-sm sm:text-base text-gray-500 mb-4">No products yet.</p>
            <Button onClick={handleAdd} className="touch-target" size="sm">
              Add Your First Product
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
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
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700"
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

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">/{product.unit}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="touch-target p-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 touch-target p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(product.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
