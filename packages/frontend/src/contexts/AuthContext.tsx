'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  storeTokens,
  clearTokens,
  isAuthenticated,
  LoginInput,
  RegisterInput,
  AuthResponse,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput, returnUrl?: string) => Promise<void>;
  register: (input: RegisterInput, returnUrl?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      // Add timeout to prevent hanging
      const userData = await Promise.race([
        getCurrentUser(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 10000)
        )
      ]);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      clearTokens();
      setUser(null);
    }
  };

  const login = async (input: LoginInput, returnUrl?: string) => {
    const response = await apiLogin(input);
    
    if (!response.tokens) {
      throw new Error('Login failed: No tokens received from server');
    }
    
    storeTokens(response.tokens.accessToken, response.tokens.refreshToken);
    
    // Refresh to get full user with tenant object
    try {
      await refreshUser();
    } catch (error) {
      console.error('Failed to refresh user after login:', error);
      // Don't fail login if refresh fails, we can still use the response data
    }
    
    // Get tenantType from refreshed user or response
    const updatedUser = await getCurrentUser().catch(() => null);
    
    // Check if super admin
    if (response.user.role === 'super_admin' || updatedUser?.role === 'super_admin') {
      router.push(returnUrl || '/admin/dashboard');
      return;
    }
    
    // Handle customer - redirect to customer dashboard or returnUrl
    if (response.user.role === 'customer' || updatedUser?.role === 'customer') {
      router.push(returnUrl || '/customer/dashboard');
      return;
    }
    
    // Handle other users with tenants
    const tenantType = (updatedUser as any)?.tenant?.type || (response.user as any)?.tenantType || 'supplier';
    router.push(returnUrl || getDashboardPath(tenantType));
  };

  const register = async (input: RegisterInput, returnUrl?: string) => {
    const response = await apiRegister(input);
    
    // Check if registration was successful but pending (no tokens)
    // Type guard: check if response has tokens property and it's defined
    if (!('tokens' in response) || !response.tokens) {
      // Registration successful but pending approval - redirect to login with message and returnUrl
      const loginUrl = returnUrl 
        ? `/auth/login?pending=true&returnUrl=${encodeURIComponent(returnUrl)}`
        : '/auth/login?pending=true';
      router.push(loginUrl);
      return;
    }
    
    // Type guard: now we know it's AuthResponse with tokens (already checked above)
    const authResponse = response as AuthResponse & { tokens: { accessToken: string; refreshToken: string } };
    
    // If tokens are provided (active registration), store them and proceed
    storeTokens(authResponse.tokens.accessToken, authResponse.tokens.refreshToken);
    // Refresh to get full user with tenant object
    await refreshUser();
    // Get tenantType from refreshed user
    const updatedUser = await getCurrentUser().catch(() => null);
    
    // Check if super admin
    if (authResponse.user.role === 'super_admin' || updatedUser?.role === 'super_admin') {
      router.push(returnUrl || '/admin/dashboard');
      return;
    }
    
    // Handle customer - redirect to customer dashboard or returnUrl
    if (authResponse.user.role === 'customer' || updatedUser?.role === 'customer') {
      router.push(returnUrl || '/customer/dashboard');
      return;
    }
    
    const tenantType = (updatedUser as any)?.tenant?.type || (authResponse.user as any)?.tenantType || 'supplier';
    router.push(returnUrl || getDashboardPath(tenantType));
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push('/auth/login');
  };

  function getDashboardPath(tenantType: string): string {
    if (tenantType === 'system') {
      return '/admin/dashboard';
    }
    return tenantType === 'supplier' ? '/supplier/dashboard' : '/company/dashboard';
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

