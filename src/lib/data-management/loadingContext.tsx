'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoadingState, LoadingContextType } from '@/lib/data-management/types';

// Default context value
const defaultLoadingState: LoadingState = {
  isLoadingUsers: false,
  isLoadingSpecifications: false,
  isLoadingProducts: false,
  isLoadingBrands: false,
};

const defaultLoadingContext: LoadingContextType = {
  loadingState: defaultLoadingState,
  setLoadingUsers: () => {},
  setLoadingSpecifications: () => {},
  setLoadingProducts: () => {},
  setLoadingBrands: () => {},
};

// Create context
export const LoadingContext = createContext<LoadingContextType>(defaultLoadingContext);

// Loading context provider
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>(defaultLoadingState);
  
  const setLoadingUsers = useCallback((isLoading: boolean) => {
    setLoadingState(prev => ({ ...prev, isLoadingUsers: isLoading }));
  }, []);
  
  const setLoadingSpecifications = useCallback((isLoading: boolean) => {
    setLoadingState(prev => ({ ...prev, isLoadingSpecifications: isLoading }));
  }, []);
  
  const setLoadingProducts = useCallback((isLoading: boolean) => {
    setLoadingState(prev => ({ ...prev, isLoadingProducts: isLoading }));
  }, []);
  
  const setLoadingBrands = useCallback((isLoading: boolean) => {
    setLoadingState(prev => ({ ...prev, isLoadingBrands: isLoading }));
  }, []);
  
  return (
    <LoadingContext.Provider
      value={{
        loadingState,
        setLoadingUsers,
        setLoadingSpecifications,
        setLoadingProducts,
        setLoadingBrands,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

// Custom hook to use loading context
export const useLoadingState = () => useContext(LoadingContext);
