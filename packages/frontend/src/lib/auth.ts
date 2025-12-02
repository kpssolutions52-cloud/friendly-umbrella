import { apiPost, apiGet } from './api';

export interface RegisterInput {
  registrationType: 'new_company' | 'new_supplier' | 'new_company_user' | 'new_supplier_user';
  tenantName?: string;
  tenantType?: 'supplier' | 'company';
  tenantId?: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: Record<string, any>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenant?: Tenant; // Optional for super admins
  tenantId?: string | null; // Optional for super admins
}

export interface AuthResponse {
  user: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse | { message: string; user: any }> {
  return apiPost<any>('/api/v1/auth/register', input);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/v1/auth/login', input);
}

export async function getCurrentUser(): Promise<User> {
  return apiGet<User>('/api/v1/auth/me');
}

export function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

