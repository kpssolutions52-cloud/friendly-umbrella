'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiGet, apiDelete } from '@/lib/api';

interface ProductImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

interface ProductImageManagerProps {
  productId: string | null;
  onImagesChange?: (images: ProductImage[]) => void;
  disabled?: boolean;
}

export function ProductImageManager({ productId, onImagesChange, disabled }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productId) {
      loadImages();
    } else {
      setImages([]);
    }
  }, [productId]);

  const loadImages = async () => {
    if (!productId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiGet<{ images: ProductImage[] }>(`/api/v1/products/${productId}/images`);
      const sortedImages = response.images.sort((a, b) => a.displayOrder - b.displayOrder);
      setImages(sortedImages);
      onImagesChange?.(sortedImages);
    } catch (err: any) {
      console.error('Failed to load images:', err);
      setError('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !productId) return;

    setIsUploading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('accessToken');

      // Upload all selected files
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 10MB)`);
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_URL}/api/v1/products/${productId}/images`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
          throw new Error(errorData.error?.message || `Failed to upload ${file.name}`);
        }

        return response.json();
      });

      await Promise.all(uploadPromises);
      await loadImages(); // Reload images after upload
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!productId || !confirm('Are you sure you want to delete this image?')) return;

    try {
      setError(null);
      await apiDelete(`/api/v1/products/${productId}/images/${imageId}`);
      await loadImages(); // Reload images after deletion
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete image');
    }
  };

  if (!productId) {
    return (
      <div className="border-t pt-4 mt-4">
        <Label className="text-base font-semibold mb-2 block">Product Images</Label>
        <p className="text-sm text-gray-500">
          Save the product first to upload images
        </p>
      </div>
    );
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Label className="text-base font-semibold">Product Images</Label>
          <p className="text-sm text-gray-500 mt-1">
            Upload multiple images for this product (JPG, PNG, GIF). Max 10MB per image.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="product-image-upload"
          disabled={disabled || isUploading}
        />
        <label
          htmlFor="product-image-upload"
          className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer touch-target ${
            disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? 'Uploading...' : '+ Upload Images'}
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading images...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No images uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Upload Images" to add product photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={image.imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteImage(image.id)}
                  disabled={disabled || isUploading}
                  className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white border-0"
                  title="Delete image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          First image will be shown in product listings. Drag to reorder (coming soon).
        </p>
      )}
    </div>
  );
}

