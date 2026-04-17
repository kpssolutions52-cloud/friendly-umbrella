/**
 * Product service — example domain service using apiClient.
 * Maps to backend GET /api/v1/products/public, etc.
 */
import { apiClient } from './api';

export interface PublicProduct {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  categoryId?: string | null;
  supplierId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsPublicResponse {
  products?: PublicProduct[];
  total?: number;
}

export const productService = {
  async getPublicProducts(params?: { limit?: number; offset?: number }): Promise<PublicProduct[]> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const query = q.toString();
    const res = await apiClient.get<ProductsPublicResponse>(
      `/api/v1/products/public${query ? `?${query}` : ''}`
    );
    return (res as ProductsPublicResponse).products ?? [];
  },

  async getPublicProductById(id: string): Promise<PublicProduct | null> {
    try {
      const res = await apiClient.get<PublicProduct>(`/api/v1/products/public/${id}`);
      return res as PublicProduct;
    } catch {
      return null;
    }
  },
};
