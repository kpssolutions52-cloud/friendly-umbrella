import { apiGet, apiPost, apiPut, apiDelete, apiPostForm } from './api';

const BASE_PATH = '/api/v1/admin';

export interface Tenant {
  id: string;
  name: string;
  type: 'supplier' | 'company';
  email: string;
  phone: string | null;
  address: string | null;
  status: 'pending' | 'active' | 'rejected';
  isActive: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  }>;
  _count?: {
    users: number;
  };
}

export interface SuperAdmin {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: 'pending' | 'active' | 'rejected';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Statistics {
  tenants: {
    pending: number;
    active: number;
    rejected: number;
    companies: number;
    suppliers: number;
  };
  users: {
    total: number;
  };
}

// Get pending tenants
export async function getPendingTenants(): Promise<{ tenants: Tenant[] }> {
  return apiGet<{ tenants: Tenant[] }>(`${BASE_PATH}/tenants/pending`);
}

// Get all tenants (with optional status and type filter)
export async function getAllTenants(
  status?: 'pending' | 'active' | 'rejected',
  type?: 'company' | 'supplier',
  page = 1,
  limit = 20
): Promise<{ tenants: Tenant[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<{ tenants: Tenant[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`${BASE_PATH}/tenants${query}`);
}

// Toggle tenant active status
export async function toggleTenantStatus(tenantId: string, isActive: boolean): Promise<{ message: string; tenant: Tenant }> {
  return apiPut<{ message: string; tenant: Tenant }>(`${BASE_PATH}/tenants/${tenantId}/toggle-status`, {
    isActive,
  });
}

// Approve or reject a tenant
export async function approveTenant(
  tenantId: string,
  approved: boolean,
  reason?: string
): Promise<{ message: string; tenant: Tenant }> {
  return apiPost<{ message: string; tenant: Tenant }>(`${BASE_PATH}/tenants/${tenantId}/approve`, {
    approved,
    reason,
  });
}

// Get all super admins
export async function getSuperAdmins(): Promise<{ admins: SuperAdmin[] }> {
  return apiGet<{ admins: SuperAdmin[] }>(`${BASE_PATH}/super-admins`);
}

// Create a new super admin
export async function createSuperAdmin(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ message: string; superAdmin: SuperAdmin }> {
  return apiPost<{ message: string; superAdmin: SuperAdmin }>(`${BASE_PATH}/super-admins`, input);
}

// Get statistics
export async function getStatistics(): Promise<Statistics> {
  return apiGet<Statistics>(`${BASE_PATH}/statistics`);
}

// Category interfaces and functions
export interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Get all categories
export async function getCategories(): Promise<{ categories: Category[] }> {
  return apiGet<{ categories: Category[] }>(`${BASE_PATH}/categories`);
}

// Get a single category
export async function getCategory(id: string): Promise<{ category: Category }> {
  return apiGet<{ category: Category }>(`${BASE_PATH}/categories/${id}`);
}

// Create a new category
export async function createCategory(input: { name: string }): Promise<{ message: string; category: Category }> {
  return apiPost<{ message: string; category: Category }>(`${BASE_PATH}/categories`, input);
}

// Update a category
export async function updateCategory(id: string, input: { name?: string }): Promise<{ message: string; category: Category }> {
  return apiPut<{ message: string; category: Category }>(`${BASE_PATH}/categories/${id}`, input);
}

// Delete a category
export async function deleteCategory(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`${BASE_PATH}/categories/${id}`);
}

// Upload category image
export async function uploadCategoryImage(id: string, file: File): Promise<{ message: string; category: Category }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiPostForm<{ message: string; category: Category }>(`${BASE_PATH}/categories/${id}/image`, formData);
}

// Delete category image
export async function deleteCategoryImage(id: string): Promise<{ message: string; category: Category }> {
  return apiDelete<{ message: string; category: Category }>(`${BASE_PATH}/categories/${id}/image`);
}



