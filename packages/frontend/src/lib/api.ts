const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// Use wss:// for HTTPS (production) and ws:// for HTTP (development)
const getWSUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return API_URL.replace('http://', 'wss://').replace('https://', 'wss://');
  }
  return API_URL.replace('http://', 'ws://');
};
const WS_URL = getWSUrl();

export { API_URL, WS_URL };

export interface ApiError {
  error: {
    message: string;
    statusCode: number;
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOn401 = true,
  customTimeout?: number
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Add timeout to prevent hanging requests - much shorter timeout for mobile
  const controller = new AbortController();
  // Use custom timeout if provided, otherwise use default (much shorter timeout for mobile)
  // Mobile networks are often slower and localhost won't work, so fail fast
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const timeout = customTimeout !== undefined ? customTimeout : (isMobile ? 3000 : 10000); // Custom timeout, or 3s for mobile, 10s for desktop
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Create timeout promise that will reject if fetch takes too long
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timeout - please check your connection'));
      }, timeout);
    });

    // Wrap fetch in Promise.race to ensure timeout works even if fetch hangs
    const fetchPromise = fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // Race between fetch and timeout to ensure we never hang indefinitely
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    // Clear timeout if fetch completed successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Handle 401 Unauthorized - try to refresh token (only if retryOn401 is true)
    if (response.status === 401 && retryOn401 && typeof window !== 'undefined') {
      const { refreshAccessToken, clearTokens } = await import('./auth');
      
      // Try to refresh the token
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Retry the request with the new token
        return apiRequest<T>(endpoint, options, false); // Don't retry again
      } else {
        // Refresh failed - clear tokens and redirect to login
        clearTokens();
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
        // Try to get error message from response before throwing
        try {
          const errorData = await response.json();
          throw {
            error: {
              message: errorData.error?.message || errorData.message || 'Authentication failed',
              statusCode: 401,
            },
          };
        } catch (parseError) {
          throw {
            error: {
              message: 'Authentication failed',
              statusCode: 401,
            },
          };
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          message: response.statusText || 'An error occurred',
          statusCode: response.status,
        },
      }));
      
      // Preserve the full error structure, especially for validation errors
      const error: any = {
        error: {
          message: errorData.message || errorData.error?.message || response.statusText || 'An error occurred',
          statusCode: response.status,
          ...(errorData.errors && { errors: errorData.errors }),
        },
        ...(errorData.errors && { errors: errorData.errors }),
      };
      
      throw error;
    }

    return response.json();
  } catch (error: any) {
    // Clear timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // Handle various error types
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timeout - please check your connection');
    }
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      throw new Error('Network error - unable to reach server. Please check your connection and API URL configuration.');
    }
    throw error;
  }
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

export async function apiPost<T>(endpoint: string, data?: any, retryOn401 = true): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }, retryOn401);
}

export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

export async function apiPostForm<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && typeof window !== 'undefined') {
    const { refreshAccessToken, clearTokens } = await import('./auth');
    
    // Try to refresh the token
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry the request with the new token
      return apiPostForm<T>(endpoint, formData);
    } else {
      // Refresh failed - clear tokens and redirect to login
      clearTokens();
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: {
        message: response.statusText || 'An error occurred',
        statusCode: response.status,
      },
    }));
    
    const error: any = {
      error: {
        message: errorData.message || errorData.error?.message || response.statusText || 'An error occurred',
        statusCode: response.status,
        ...(errorData.errors && { errors: errorData.errors }),
      },
      ...(errorData.errors && { errors: errorData.errors }),
    };
    
    throw error;
  }

  return response.json();
}

// Public category functions (no authentication required)
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

// Get all active categories (hierarchical) - Public endpoint
export async function getCategories(): Promise<{ categories: ProductCategory[] }> {
  return apiGet<{ categories: ProductCategory[] }>('/api/v1/categories');
}

// Get flat list of categories for dropdowns - Public endpoint
export async function getFlatCategories(): Promise<{ categories: Array<{ id: string; name: string; parentName?: string }> }> {
  return apiGet<{ categories: Array<{ id: string; name: string; parentName?: string }> }>('/api/v1/categories/flat');
}

// Get only main categories - Public endpoint
export async function getMainCategories(): Promise<{ categories: ProductCategory[] }> {
  return apiGet<{ categories: ProductCategory[] }>('/api/v1/categories/main');
}

// Get subcategories for a main category - Public endpoint
export async function getSubcategories(parentId: string): Promise<{ categories: ProductCategory[] }> {
  return apiGet<{ categories: ProductCategory[] }>(`/api/v1/categories/${parentId}/subcategories`);
}

// Service category functions (no authentication required)
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

// Get all active service categories (hierarchical) - Public endpoint
export async function getServiceCategories(): Promise<{ categories: ServiceCategory[] }> {
  return apiGet<{ categories: ServiceCategory[] }>('/api/v1/service-categories');
}

// Get only main service categories - Public endpoint
export async function getMainServiceCategories(): Promise<{ categories: ServiceCategory[] }> {
  return apiGet<{ categories: ServiceCategory[] }>('/api/v1/service-categories/main');
}

// Get subcategories for a main service category - Public endpoint
export async function getServiceSubcategories(parentId: string): Promise<{ categories: ServiceCategory[] }> {
  return apiGet<{ categories: ServiceCategory[] }>(`/api/v1/service-categories/${parentId}/subcategories`);
}





