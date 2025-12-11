'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getAllCategories,
  getMainCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryIcon,
  deleteCategoryIcon,
  ProductCategory,
  getAllServiceCategories,
  getMainServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  uploadServiceCategoryIcon,
  deleteServiceCategoryIcon,
  ServiceCategory,
} from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CategoryManagement() {
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<ProductCategory[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [mainServiceCategories, setMainServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | ServiceCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: null as string | null,
  });
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    loadCategories();
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'products') {
        const data = await getAllCategories(true); // Include inactive for admin view
        setCategories(data.categories || []);
        
        // Also load main categories for parent selection
        const mainData = await getMainCategories(true);
        setMainCategories(mainData.categories || []);
      } else {
        const data = await getAllServiceCategories(true); // Include inactive for admin view
        setServiceCategories(data.categories || []);
        
        // Also load main service categories for parent selection
        const mainData = await getMainServiceCategories(true);
        setMainServiceCategories(mainData.categories || []);
      }
    } catch (err: any) {
      setError(String(err?.error?.message || err?.message || `Failed to load ${activeTab === 'products' ? 'product' : 'service'} categories`));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      if (editingCategory) {
        // For main categories, don't allow changing parentId
        const updateData: any = {
          name: formData.name,
          description: formData.description || undefined,
        };
        // Only include parentId if it's a subcategory (can be changed)
        if (editingCategory.parentId) {
          updateData.parentId = formData.parentId;
        }
        if (activeTab === 'products') {
          await updateCategory(editingCategory.id, updateData);
        } else {
          await updateServiceCategory(editingCategory.id, updateData);
        }
        setSuccess('Category updated successfully');
      } else {
        if (activeTab === 'products') {
          await createCategory({
            name: formData.name,
            description: formData.description || undefined,
            parentId: formData.parentId || undefined,
          });
        } else {
          await createServiceCategory({
            name: formData.name,
            description: formData.description || undefined,
            parentId: formData.parentId || undefined,
          });
        }
        setSuccess('Category created successfully');
      }

      // Reset form
      setFormData({ name: '', description: '', parentId: null });
      setShowCreateForm(false);
      setEditingCategory(null);
      setAddingSubcategoryTo(null);
      await loadCategories();
    } catch (err: any) {
      setError(String(err?.error?.message || err?.message || `Failed to ${editingCategory ? 'update' : 'create'} category`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: ProductCategory | ServiceCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId, // Keep original parentId, but disable editing for main categories
    });
    setAddingSubcategoryTo(null);
    setShowCreateForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleAddSubcategory = (parentCategory: ProductCategory | ServiceCategory) => {
    setAddingSubcategoryTo(parentCategory.id);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parentId: parentCategory.id,
    });
    setShowCreateForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', parentId: null });
    setShowCreateForm(false);
    setEditingCategory(null);
    setAddingSubcategoryTo(null);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      if (activeTab === 'products') {
        await deleteCategory(id);
      } else {
        await deleteServiceCategory(id);
      }
      setSuccess('Category deleted successfully');
      await loadCategories();
    } catch (err: any) {
      setError(String(err?.error?.message || err?.message || 'Failed to delete category'));
    }
  };

  const handleToggleActive = async (category: ProductCategory | ServiceCategory) => {
    try {
      setError(null);
      setSuccess(null);
      if (activeTab === 'products') {
        await updateCategory(category.id, { isActive: !category.isActive });
      } else {
        await updateServiceCategory(category.id, { isActive: !category.isActive });
      }
      setSuccess(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully`);
      await loadCategories();
    } catch (err: any) {
      setError(String(err?.error?.message || err?.message || 'Failed to update category'));
    }
  };

  const handleIconUpload = async (categoryId: string, file: File) => {
    try {
      setUploadingIcon(categoryId);
      setError(null);
      setSuccess(null);
      await uploadCategoryIcon(categoryId, file);
      setSuccess('Icon uploaded successfully');
      await loadCategories();
    } catch (err: any) {
      setError(String(err?.error?.message || err?.message || 'Failed to upload icon'));
    } finally {
      setUploadingIcon(null);
    }
  };

  const handleIconDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category icon?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      if (activeTab === 'products') {
        await deleteCategoryIcon(categoryId);
      } else {
        await deleteServiceCategoryIcon(categoryId);
      }
      setSuccess('Icon deleted successfully');
      await loadCategories();
    } catch (err: any) {
      setError(String(err?.error?.message || err?.message || 'Failed to delete icon'));
    }
  };

  const handleFileSelect = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      handleIconUpload(categoryId, file);
    }

    // Reset input
    if (fileInputRefs.current[categoryId]) {
      fileInputRefs.current[categoryId]!.value = '';
    }
  };

  const renderCategoryRow = (category: ProductCategory | ServiceCategory, level = 0): JSX.Element => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <>
        <tr key={category.id} className={`hover:bg-gray-50 ${!category.isActive ? 'opacity-60' : ''}`}>
          <td className="px-6 py-4 whitespace-nowrap" style={{ paddingLeft: `${20 + level * 24}px` }}>
            <div className="flex items-center gap-3">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              {!hasChildren && <span className="w-4" />}
              {/* Show icon for both main categories and subcategories */}
              {category.iconUrl ? (
                <div className="relative group">
                  <img
                    src={category.iconUrl}
                    alt={category.name}
                    className="h-12 w-12 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
              {category.parent && (
                <span className="text-xs text-gray-500">({category.parent.name})</span>
              )}
            </div>
            {category.description && (
              <div className="text-sm text-gray-500 mt-1">{category.description}</div>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 text-xs rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex justify-end gap-2">
              {/* Icon upload/delete - for both main categories and subcategories */}
              <>
                <input
                  ref={(el) => {
                    fileInputRefs.current[category.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(category.id, e)}
                  className="hidden"
                  disabled={uploadingIcon === category.id}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current[category.id]?.click()}
                  disabled={uploadingIcon === category.id}
                >
                  {uploadingIcon === category.id ? 'Uploading...' : category.iconUrl ? 'Change Icon' : 'Upload Icon'}
                </Button>
                {category.iconUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleIconDelete(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove Icon
                  </Button>
                )}
              </>
              {/* Add Subcategory button - only for main categories */}
              {!category.parentId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSubcategory(category)}
                  disabled={!!editingCategory || !!addingSubcategoryTo}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Add Subcategory
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
                disabled={!!editingCategory || !!addingSubcategoryTo}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(category)}
                disabled={!!editingCategory || !!addingSubcategoryTo}
                className={category.isActive ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
              >
                {category.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category.id)}
                disabled={!!editingCategory || !!addingSubcategoryTo}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && category.children?.map((child) => renderCategoryRow(child, level + 1))}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Products vs Services Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setShowCreateForm(false);
              setEditingCategory(null);
              setAddingSubcategoryTo(null);
            }}
            className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
              activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Product Categories
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('services');
              setShowCreateForm(false);
              setEditingCategory(null);
              setAddingSubcategoryTo(null);
            }}
            className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
              activeTab === 'services' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Service Categories
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <div className="flex gap-2">
          <Button onClick={loadCategories} variant="outline">
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} disabled={!!editingCategory || !!addingSubcategoryTo}>
            {showCreateForm ? 'Cancel' : editingCategory || addingSubcategoryTo ? 'Cancel' : `Create Main ${activeTab === 'products' ? 'Product' : 'Service'} Category`}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {addingSubcategoryTo
              ? `Add Subcategory to "${(activeTab === 'products' ? mainCategories : mainServiceCategories).find(c => c.id === addingSubcategoryTo)?.name || 'Category'}"`
              : editingCategory
              ? editingCategory.parentId
                ? 'Edit Subcategory'
                : 'Edit Main Category'
              : `Create New ${activeTab === 'products' ? 'Product' : 'Service'} Category`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="parentId">
                Parent Category {addingSubcategoryTo ? '(Pre-selected)' : editingCategory && !editingCategory.parentId ? '(Cannot change for main categories)' : '(Optional)'}
              </Label>
              <select
                id="parentId"
                value={formData.parentId || ''}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                disabled={!!addingSubcategoryTo || (!!editingCategory && !editingCategory.parentId)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">None (Main Category)</option>
                {(activeTab === 'products' ? mainCategories : mainServiceCategories)
                  .filter((cat) => !editingCategory || cat.id !== editingCategory.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {addingSubcategoryTo
                  ? 'This will be created as a subcategory under the selected parent.'
                  : editingCategory && !editingCategory.parentId
                  ? 'Main categories cannot be moved to become subcategories. Only name and description can be edited.'
                  : 'Leave empty to create a main category, or select a parent to create a subcategory'}
              </p>
            </div>
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter category description (optional)"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {(activeTab === 'products' ? categories : serviceCategories).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No {activeTab === 'products' ? 'product' : 'service'} categories found. Create your first category to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activeTab === 'products' ? categories : serviceCategories).map((category) => renderCategoryRow(category))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
