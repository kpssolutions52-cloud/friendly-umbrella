/**
 * Central API client: base URL, Bearer token, 401 refresh and retry.
 * All services should use this for HTTP calls.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'construction_guru_access_token';
const REFRESH_TOKEN_KEY = 'construction_guru_refresh_token';

const getBaseUrl = (): string => {
  // In Expo, use env from app.config or process.env
  const url = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';
  return url.replace(/\/$/, '');
};

export const getApiBaseUrl = getBaseUrl;

export interface ApiError {
  error?: { message?: string; statusCode?: number };
  message?: string;
  statusCode?: number;
}

async function getStoredAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearStoredTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {}
}

export async function setStoredTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
}

export async function setStoredAccessToken(access: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
}

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Returns new access token or null on failure.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getStoredRefreshToken();
  if (!refresh) return null;
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  const access = data?.accessToken;
  if (access) await setStoredAccessToken(access);
  return access || null;
}

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  retryOn401?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestConfig = {},
  retryOnce = true
): Promise<T> {
  const { skipAuth = false, retryOn401 = true, ...init } = options;
  const base = getBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = skipAuth ? null : await getStoredAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...init.headers } as HeadersInit,
  });

  if (res.status === 401 && retryOn401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken && retryOnce) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const retryRes = await fetch(url, { ...init, headers: retryHeaders as HeadersInit });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw Object.assign(new Error(err?.error?.message || err?.message || 'Request failed'), {
          statusCode: retryRes.status,
          data: err,
        });
      }
      return retryRes.json();
    }
    throw Object.assign(new Error('Authentication failed'), { statusCode: 401 });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error(err?.error?.message || err?.message || res.statusText || 'Request failed'),
      { statusCode: res.status, data: err }
    );
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json();
  return res.text() as unknown as T;
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),
};
