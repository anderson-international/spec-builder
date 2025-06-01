'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, AuthState } from '@/lib/auth/types';

// Default context value
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  isAdmin: () => false,
  isReviewer: () => false,
};

// Create context
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Auth context provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // On mount, check for stored user
  useEffect(() => {
    // For testing purposes, let's clear any existing login to force manual login
    localStorage.removeItem('spec-builder-user');
    
    setAuthState({
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Login function
  const login = async (userId: string) => {
    setAuthState({
      ...authState,
      isLoading: true,
      error: null,
    });

    try {
      // In a real app, this would be an API call
      // For local development, we'll just fetch from the server component
      const response = await fetch(`/api/auth/user/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const user = await response.json();
      
      // Store user in localStorage for persistence
      localStorage.setItem('spec-builder-user', JSON.stringify(user));
      
      setAuthState({
        user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Login error:', error);
      setAuthState({
        ...authState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error during login',
      });
    }
  };

  // Logout function
  const logout = async () => {
    // Clear stored user
    localStorage.removeItem('spec-builder-user');
    
    setAuthState({
      user: null,
      isLoading: false,
      error: null,
    });
  };

  // Helper functions
  const isAdmin = () => authState.user?.role === 'admin';
  const isReviewer = () => authState.user?.role === 'reviewer';

  // Provide the auth context
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAdmin,
        isReviewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);
