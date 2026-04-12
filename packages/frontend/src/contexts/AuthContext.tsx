'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  storeTokens,
  clearTokens,
  isAuthenticated as checkIsAuthenticated,
  LoginInput,
  RegisterInput,
  AuthResponse,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput, returnUrl?: string) => Promise<void>;
  register: (input: RegisterInput, returnUrl?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function detectMobile(): boolean {
  return typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // CRITICAL: Force loading to false if it's been true for too long (safety net)
  useEffect(() => {
    if (loading) {
      const isMobile = detectMobile();
      const maxLoadingTime = isMobile ? 10000 : 20000; // 10s mobile, 20s desktop
      
      const forceStopTimeout = setTimeout(() => {
        if (loading) {
          console.error('CRITICAL: Loading state stuck - forcing to false');
          setLoading(false);
          // Clear tokens if we can't verify auth
          if (checkIsAuthenticated()) {
            clearTokens();
            setUser(null);
          }
        }
      }, maxLoadingTime);
      
      return () => clearTimeout(forceStopTimeout);
    }
  }, [loading]);

  const refreshUser = useCallback(async () => {
    try {
      // Detect mobile and use shorter timeout
      const isMobile = detectMobile();
      const timeout = isMobile ? 3000 : 8000; // 3s for mobile, 8s for desktop
      
      // Add timeout to prevent hanging - much shorter for mobile
      const userData = await Promise.race([
        getCurrentUser(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), timeout)
        )
      ]);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Clear tokens and set user to null on any error (network, timeout, etc.)
      clearTokens();
      setUser(null);
      // Re-throw to let caller know it failed
      throw error;
    }
  }, []);

  useEffect(() => {
    // Detect mobile and use shorter timeout
    const isMobile = detectMobile();
    const hardTimeout = isMobile ? 5000 : 12000; // 5s for mobile, 12s for desktop
    
    // Check if API URL is localhost on mobile - this won't work, clear tokens immediately
    if (isMobile && typeof window !== 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
        console.warn('Mobile device detected with localhost API URL - clearing tokens and skipping auth');
        clearTokens();
        setLoading(false);
        setUser(null);
        return;
      }
    }
    
    // ABSOLUTE MAXIMUM timeout - this ALWAYS clears loading state no matter what
    const absoluteMaxTimeout = setTimeout(() => {
      console.error('ABSOLUTE MAX TIMEOUT: Forcing loading to false - auth check took too long');
      setLoading(false);
      // Don't clear tokens here - let the user try to use the app
    }, isMobile ? 8000 : 15000); // 8s mobile, 15s desktop
    
    // Check if user is already authenticated
    if (checkIsAuthenticated()) {
      // Add a hard timeout that ALWAYS triggers to prevent infinite loading
      // This is a safety net in case refreshUser hangs
      const hardTimeoutId = setTimeout(() => {
        console.warn('Auth loading hard timeout reached - forcing stop');
        setLoading(false);
        setUser(null);
        clearTokens(); // Clear tokens if we can't verify them
      }, hardTimeout);
      
      refreshUser()
        .catch((error) => {
          // Error already handled in refreshUser, just log it
          console.error('Auth check failed:', error);
        })
        .finally(() => {
          clearTimeout(hardTimeoutId);
          clearTimeout(absoluteMaxTimeout);
          setLoading(false);
        });
    } else {
      clearTimeout(absoluteMaxTimeout);
      setLoading(false);
    }
    
    // Cleanup on unmount
    return () => {
      clearTimeout(absoluteMaxTimeout);
    };
  }, [refreshUser]);

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
    
    // Check if super admin - only redirect super admins, all others go to home page
    if (response.user.role === 'super_admin' || updatedUser?.role === 'super_admin') {
      router.push(returnUrl || '/admin/dashboard');
      return;
    }
    
    // If returnUrl is provided, use it (e.g., from demo login)
    if (returnUrl) {
      router.push(returnUrl);
      return;
    }
    
    // Otherwise, redirect based on user type
    const userType = updatedUser?.type || response.user.type;
    const tenantType = updatedUser?.tenant?.type;
    
    // Redirect suppliers to their chat page
    if (userType === 'supplier' || tenantType === 'supplier') {
      router.push('/supplier/chat');
      return;
    }
    
    // Redirect QS to chat
    if (userType === 'qs') {
      router.push('/chat');
      return;
    }
    
    // All other users (customers, companies, service providers) go to home page
    router.push('/');
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
    
    // Check if super admin - only redirect super admins, all others go to home page
    if (authResponse.user.role === 'super_admin' || updatedUser?.role === 'super_admin') {
      router.push(returnUrl || '/admin/dashboard');
      return;
    }
    
    // All other users (customers, suppliers, companies, service providers) go to home page
    // They can see Products/Services tabs and browse the shop
    router.push(returnUrl || '/');
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push('/auth/login');
  };

  // Calculate isAuthenticated based on user and tokens
  const isAuthenticatedValue = !!user && checkIsAuthenticated();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: isAuthenticatedValue,
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

