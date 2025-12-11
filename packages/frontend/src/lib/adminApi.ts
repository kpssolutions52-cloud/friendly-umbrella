import { apiGet, apiPost, apiPut, apiDelete, apiPostForm } from './api';

const BASE_PATH = '/api/v1/admin';

export interface Tenant {
  id: string;
  name: string;
  type: 'supplier' | 'company' | 'service_provider';
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

export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: 'pending' | 'active' | 'rejected';
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
    pending?: number;
  };
}

// Get pending tenants
export async function getPendingTenants(): Promise<{ tenants: Tenant[] }> {
  return apiGet<{ tenants: Tenant[] }>(`${BASE_PATH}/tenants/pending`);
}

// Get all tenants (with optional status and type filter)
export async function getAllTenants(
  status?: 'pending' | 'active' | 'rejected',
  type?: 'company' | 'supplier' | 'service_provider',
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
export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: ProductCategory[];
  parent?: {
    id: string;
    name: string;
  } | null;
}

// Get all categories (hierarchical)
export async function getAllCategories(includeInactive = false): Promise<{ categories: ProductCategory[] }> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiGet<{ categories: ProductCategory[] }>(`${BASE_PATH}/categories${query}`);
}

// Get flat list of categories (for dropdowns)
export async function getFlatCategories(includeInactive = false): Promise<{ categories: Array<{ id: string; name: string; parentName?: string }> }> {
  const query = includeInactive ? '?flat=true&includeInactive=true' : '?flat=true';
  return apiGet<{ categories: Array<{ id: string; name: string; parentName?: string }> }>(`${BASE_PATH}/categories${query}`);
}

// Get only main categories
export async function getMainCategories(includeInactive = false): Promise<{ categories: ProductCategory[] }> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiGet<{ categories: ProductCategory[] }>(`${BASE_PATH}/categories/main${query}`);
}

// Get subcategories for a main category
export async function getSubcategories(parentId: string, includeInactive = false): Promise<{ categories: ProductCategory[] }> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiGet<{ categories: ProductCategory[] }>(`${BASE_PATH}/categories/${parentId}/subcategories${query}`);
}

// Get a single category
export async function getCategory(id: string): Promise<{ category: ProductCategory }> {
  return apiGet<{ category: ProductCategory }>(`${BASE_PATH}/categories/${id}`);
}

// Create a new category (main or subcategory)
export async function createCategory(input: {
  name: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
}): Promise<{ message: string; category: ProductCategory }> {
  return apiPost<{ message: string; category: ProductCategory }>(`${BASE_PATH}/categories`, input);
}

// Update a category
export async function updateCategory(
  id: string,
  input: {
    name?: string;
    description?: string;
    parentId?: string | null;
    isActive?: boolean;
    displayOrder?: number;
    iconUrl?: string | null;
  }
): Promise<{ message: string; category: ProductCategory }> {
  return apiPut<{ message: string; category: ProductCategory }>(`${BASE_PATH}/categories/${id}`, input);
}

// Delete a category
export async function deleteCategory(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`${BASE_PATH}/categories/${id}`);
}

// Upload category icon
export async function uploadCategoryIcon(id: string, file: File): Promise<{ message: string; category: ProductCategory }> {
  const formData = new FormData();
  formData.append('icon', file);
  return apiPostForm<{ message: string; category: ProductCategory }>(`${BASE_PATH}/categories/${id}/icon`, formData);
}

// Delete category icon
export async function deleteCategoryIcon(id: string): Promise<{ message: string; category: ProductCategory }> {
  return apiDelete<{ message: string; category: ProductCategory }>(`${BASE_PATH}/categories/${id}/icon`);
}

// Legacy interface for backward compatibility
export interface Category extends ProductCategory {}

// Service Category interfaces and functions
export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: ServiceCategory[];
  parent?: {
    id: string;
    name: string;
  } | null;
}

// Get all service categories (hierarchical)
export async function getAllServiceCategories(includeInactive = false): Promise<{ categories: ServiceCategory[] }> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiGet<{ categories: ServiceCategory[] }>(`${BASE_PATH}/service-categories${query}`);
}

// Get flat list of service categories (for dropdowns)
export async function getFlatServiceCategories(includeInactive = false): Promise<{ categories: Array<{ id: string; name: string; parentName?: string }> }> {
  const query = includeInactive ? '?flat=true&includeInactive=true' : '?flat=true';
  return apiGet<{ categories: Array<{ id: string; name: string; parentName?: string }> }>(`${BASE_PATH}/service-categories${query}`);
}

// Get only main service categories
export async function getMainServiceCategories(includeInactive = false): Promise<{ categories: ServiceCategory[] }> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiGet<{ categories: ServiceCategory[] }>(`${BASE_PATH}/service-categories/main${query}`);
}

// Get subcategories for a main service category
export async function getServiceSubcategories(parentId: string, includeInactive = false): Promise<{ categories: ServiceCategory[] }> {
  const query = includeInactive ? '?includeInactive=true' : '';
  return apiGet<{ categories: ServiceCategory[] }>(`${BASE_PATH}/service-categories/${parentId}/subcategories${query}`);
}

// Get a single service category
export async function getServiceCategory(id: string): Promise<{ category: ServiceCategory }> {
  return apiGet<{ category: ServiceCategory }>(`${BASE_PATH}/service-categories/${id}`);
}

// Create a new service category (main or subcategory)
export async function createServiceCategory(input: {
  name: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
}): Promise<{ message: string; category: ServiceCategory }> {
  return apiPost<{ message: string; category: ServiceCategory }>(`${BASE_PATH}/service-categories`, input);
}

// Update a service category
export async function updateServiceCategory(
  id: string,
  input: {
    name?: string;
    description?: string;
    parentId?: string | null;
    isActive?: boolean;
    displayOrder?: number;
    iconUrl?: string | null;
  }
): Promise<{ message: string; category: ServiceCategory }> {
  return apiPut<{ message: string; category: ServiceCategory }>(`${BASE_PATH}/service-categories/${id}`, input);
}

// Delete a service category
export async function deleteServiceCategory(id: string): Promise<{ message: string }> {
  return apiDelete<{ message: string }>(`${BASE_PATH}/service-categories/${id}`);
}

// Upload service category icon
export async function uploadServiceCategoryIcon(id: string, file: File): Promise<{ message: string; category: ServiceCategory }> {
  const formData = new FormData();
  formData.append('icon', file);
  return apiPostForm<{ message: string; category: ServiceCategory }>(`${BASE_PATH}/service-categories/${id}/icon`, formData);
}

// Delete service category icon
export async function deleteServiceCategoryIcon(id: string): Promise<{ message: string; category: ServiceCategory }> {
  return apiDelete<{ message: string; category: ServiceCategory }>(`${BASE_PATH}/service-categories/${id}/icon`);
}

// Get pending customers
export async function getPendingCustomers(): Promise<{ customers: Customer[] }> {
  return apiGet<{ customers: Customer[] }>(`${BASE_PATH}/customers/pending`);
}

// Approve or reject a customer
export async function approveCustomer(
  customerId: string,
  approved: boolean,
  reason?: string
): Promise<{ message: string; customer: Customer }> {
  return apiPost<{ message: string; customer: Customer }>(`${BASE_PATH}/customers/${customerId}/approve`, {
    approved,
    reason,
  });
}



