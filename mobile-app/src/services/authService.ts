/**
 * Auth service: login, register, getMe, logout.
 * Uses apiClient and SecureStore; matches existing backend /api/v1/auth/*.
 */
import * as SecureStore from 'expo-secure-store';
import { apiClient, clearStoredTokens, setStoredTokens } from './api/apiClient';

const ACCESS_TOKEN_KEY = 'construction_guru_access_token';
const REFRESH_TOKEN_KEY = 'construction_guru_refresh_token';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  type?: 'qs' | 'supplier';
  organization?: { id: string; name: string; type: 'company' | 'supplier' };
  organizationId?: string | null;
  tenantId?: string | null;
}

export interface AuthResponse {
  user: User;
  tokens?: { accessToken: string; refreshToken: string };
  message?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  userType: 'qs' | 'supplier';
  email: string;
  password: string;
  organizationId?: string;
  organizationName?: string;
  name?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', { email, password }, { skipAuth: true });
    const data = res as AuthResponse;
    if (data.tokens?.accessToken && data.tokens?.refreshToken) {
      await setStoredTokens(data.tokens.accessToken, data.tokens.refreshToken);
    }
    return data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/register', input, { skipAuth: true });
    const data = res as AuthResponse;
    if (data.tokens?.accessToken && data.tokens?.refreshToken) {
      await setStoredTokens(data.tokens.accessToken, data.tokens.refreshToken);
    }
    return data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<{ user?: User } & User>('/api/v1/auth/me');
    const u = (res as { user?: User }).user ?? (res as User);
    return u;
  },

  async logout(): Promise<void> {
    await clearStoredTokens();
  },

  /**
   * Restore session: if we have an access token, fetch /me and return user; otherwise clear and return null.
   */
  async getStoredUserOrRestore(): Promise<User | null> {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (!token) return null;
    try {
      const user = await this.getMe();
      return user;
    } catch {
      await clearStoredTokens();
      return null;
    }
  },
};
