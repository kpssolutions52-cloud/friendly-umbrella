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
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
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
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      clearTokens();
      setUser(null);
    }
  };

  const login = async (input: LoginInput) => {
    const response = await apiLogin(input);
    storeTokens(response.tokens.accessToken, response.tokens.refreshToken);
    // Refresh to get full user with tenant object
    await refreshUser();
    // Get tenantType from refreshed user
    const updatedUser = await getCurrentUser().catch(() => null);
    const tenantType = (updatedUser as any)?.tenant?.type || (response.user as any)?.tenantType || 'supplier';
    router.push(getDashboardPath(tenantType));
  };

  const register = async (input: RegisterInput) => {
    const response = await apiRegister(input);
    storeTokens(response.tokens.accessToken, response.tokens.refreshToken);
    // Refresh to get full user with tenant object
    await refreshUser();
    // Get tenantType from refreshed user
    const updatedUser = await getCurrentUser().catch(() => null);
    const tenantType = (updatedUser as any)?.tenant?.type || (response.user as any)?.tenantType || 'supplier';
    router.push(getDashboardPath(tenantType));
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push('/auth/login');
  };

  function getDashboardPath(tenantType: string): string {
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

