'use client';

import { useEffect, useState, useRef } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, uploadCategoryImage, deleteCategoryImage, Category } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data.categories);
      setError(null);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: formData.name });
      } else {
        await createCategory({ name: formData.name });
      }
      
      // Reset form
      setFormData({ name: '' });
      setShowCreateForm(false);
      setEditingCategory(null);
      await loadCategories(); // Refresh list
    } catch (err: any) {
      setError(err.error?.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '' });
    setShowCreateForm(false);
    setEditingCategory(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await deleteCategory(id);
      await loadCategories(); // Refresh list
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete category');
    }
  };

  const handleImageUpload = async (categoryId: string, file: File) => {
    try {
      setUploadingImage(categoryId);
      setError(null);
      await uploadCategoryImage(categoryId, file);
      await loadCategories(); // Refresh list
    } catch (err: any) {
      setError(err.error?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleImageDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category image?')) {
      return;
    }

    try {
      setError(null);
      await deleteCategoryImage(categoryId);
      await loadCategories(); // Refresh list
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete image');
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

      handleImageUpload(categoryId, file);
    }
    
    // Reset input
    if (fileInputRefs.current[categoryId]) {
      fileInputRefs.current[categoryId]!.value = '';
    }
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <div className="flex gap-2">
          <Button onClick={loadCategories} variant="outline">
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} disabled={!!editingCategory}>
            {showCreateForm ? 'Cancel' : 'Create Category'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No categories found. Create your first category to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {category.imageUrl ? (
                          <div className="relative group">
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <button
                              onClick={() => handleImageDelete(category.id)}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete image"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <input
                            ref={(el) => (fileInputRefs.current[category.id] = el)}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(category.id, e)}
                            className="hidden"
                            disabled={uploadingImage === category.id}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRefs.current[category.id]?.click()}
                            disabled={uploadingImage === category.id}
                          >
                            {uploadingImage === category.id ? 'Uploading...' : category.imageUrl ? 'Change' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          disabled={!!editingCategory}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={!!editingCategory}
                          className="text-red-600 hover:text-red-700"
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
    </div>
  );
}

