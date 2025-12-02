const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export { API_URL, WS_URL };

export interface ApiError {
  error: {
    message: string;
    statusCode: number;
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

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
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

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

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  // Try to parse JSON, but handle empty responses gracefully
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return undefined as T;
  }
}









