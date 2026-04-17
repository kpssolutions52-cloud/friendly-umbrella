/**
 * Secure token storage and auth state.
 * Uses Expo SecureStore for tokens; exposes login, logout, restoreSession, and user.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/authService';
import type { User } from '@/services/authService';

const ACCESS_TOKEN_KEY = 'construction_guru_access_token';
const REFRESH_TOKEN_KEY = 'construction_guru_refresh_token';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const u = await authService.getStoredUserOrRestore();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const u = await authService.getMe();
      setUser(u);
    } catch {
      await logout();
    }
  }, [user, logout]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: u } = await authService.login(email, password);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      restoreSession,
      refreshUser,
    }),
    [user, isLoading, login, logout, restoreSession, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
