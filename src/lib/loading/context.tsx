'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
  section?: string;
}

interface LoadingContextType {
  loadingState: LoadingState;
  startLoading: (message?: string, section?: string) => void;
  stopLoading: (section?: string) => void;
  isLoadingSection: (section: string) => boolean;
}

const defaultLoadingContext: LoadingContextType = {
  loadingState: {
    isLoading: false,
    message: '',
  },
  startLoading: () => {},
  stopLoading: () => {},
  isLoadingSection: () => false,
};

export const LoadingContext = createContext<LoadingContextType>(defaultLoadingContext);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: '',
  });

  const startLoading = useCallback((message = 'Loading...', section?: string) => {
    setLoadingState({
      isLoading: true,
      message,
      section,
    });
  }, []);

  const stopLoading = useCallback((section?: string) => {
    setLoadingState((prevState) => {
      // If a section is specified, only stop loading if it matches the current section
      if (section && prevState.section !== section) {
        return prevState;
      }
      return {
        isLoading: false,
        message: '',
        section: undefined,
      };
    });
  }, []);

  const isLoadingSection = useCallback((section: string) => {
    return loadingState.isLoading && loadingState.section === section;
  }, [loadingState]);

  return (
    <LoadingContext.Provider
      value={{
        loadingState,
        startLoading,
        stopLoading,
        isLoadingSection,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);
