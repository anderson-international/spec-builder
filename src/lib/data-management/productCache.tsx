'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  ProductCacheState, 
  ProductContextType, 
  ShopifyProduct 
} from '@/lib/data-management/types';

// Default context value
const defaultProductCacheState: ProductCacheState = {
  products: new Map<string, ShopifyProduct>(),
  loadingHandles: new Set<string>(),
  isLoadingBatch: false,
  error: null,
  
  // Progressive batch loading properties
  currentCursor: undefined,
  isBackgroundLoading: false,
  isLoadingComplete: false,
  batchesLoaded: 0,
  totalProductsLoaded: 0,
};

const defaultProductContext: ProductContextType = {
  state: defaultProductCacheState,
  getProduct: () => undefined,
  preloadProducts: async () => {},
  fetchProductsByHandles: async () => {},
  resetCache: () => {},
  isProductLoading: () => false,
  
  // Core progressive batch loading functions
  startBackgroundLoading: async () => {},
  loadNextBatch: async () => false,
};

// Create context
export const ProductContext = createContext<ProductContextType>(defaultProductContext);

// Product context provider
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProductCacheState>(defaultProductCacheState);
  
  // Create refs to store functions for stable references in effects
  const setStateRef = useRef(setState);
  
  // Update the setState ref when it changes
  useEffect(() => {
    setStateRef.current = setState;
  }, [setState]);

  // Get a product by handle
  const getProduct = useCallback((handle: string) => {
    return state.products.get(handle);
  }, [state.products]);

  // Reset cache
  const resetCache = useCallback(() => {
    setStateRef.current(defaultProductCacheState);
  }, []);

  // Abort controller for cleanup of in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Maximum retries for failed requests
  const maxRetriesRef = useRef<number>(3);
  const currentRetriesRef = useRef<number>(0);
  
  // State refs to prevent closure problems
  const stateRef = useRef<ProductCacheState>(state);
  
  // Keep stateRef up to date
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // Preload initial batch of products using refs to avoid dependency loops
  const preloadProducts = useCallback(async (userId?: string) => {
    // Use stateRef to check current state without causing dependency issues
    if (stateRef.current.isLoadingBatch || stateRef.current.products.size > 0) return;
    
    // Reset retry counter
    currentRetriesRef.current = 0;
    
    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setStateRef.current(prev => ({ ...prev, isLoadingBatch: true, error: null }));

    try {
      // Load the first batch of products using the batch API
      const response = await fetch('/api/products/batch?limit=25', {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch initial product batch: ${response.status}`);
      }
      
      const data = await response.json();
      const { products, nextCursor, hasNextPage } = data;
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid response format from products batch API');
      }
      
      // Update cache with initial set of products and set background loading flag in one update
      setStateRef.current(prev => {
        const updatedProducts = new Map(prev.products);
        const updatedLoadingHandles = new Set(prev.loadingHandles);
        
        products.forEach(product => {
          updatedProducts.set(product.handle, product);
          updatedLoadingHandles.delete(product.handle);
        });
        
        return {
          ...prev,
          products: updatedProducts,
          loadingHandles: updatedLoadingHandles,
          isLoadingBatch: false,
          currentCursor: nextCursor,
          isLoadingComplete: !hasNextPage,
          // Set background loading flag directly in this update if more products exist
          // Eliminates setTimeout and prevents extra re-render
          isBackgroundLoading: hasNextPage,
          batchesLoaded: 1,
          totalProductsLoaded: products.length,
        };
      });
    } catch (error) {
        // Only log if not aborted
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error in preloadProducts:', error);
          setStateRef.current(prev => ({ 
            ...prev, 
            isLoadingBatch: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
          }));
        }
    }
  }, []); // No dependencies needed as we use stateRef instead of direct state access

  // Fetch specific products by handles (high priority)
  const fetchProductsByHandles = useCallback(async (handles: string[]) => {
    if (!handles?.length) return;
    
    // Get latest state to avoid stale closures
    let currentState: ProductCacheState;
    setState(prev => {
      currentState = prev;
      return prev; // No actual update
    });
    
    // Cancel any previous requests for these handles
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Reset retry counter
    currentRetriesRef.current = 0;
    
    // Mark all handles as loading
    setStateRef.current(prev => {
      const updatedLoadingHandles = new Set(prev.loadingHandles);
      handles.forEach(handle => updatedLoadingHandles.add(handle));
      return {
        ...prev,
        loadingHandles: updatedLoadingHandles,
        error: null,
      };
    });
    
    try {
      // Only fetch products that aren't already loaded
      const unloadedHandles = handles.filter(handle => !stateRef.current.products.has(handle));
      
      if (unloadedHandles.length === 0) {
        return; // All handles are already loaded
      }
      
      // Build query param with multiple handles
      const params = new URLSearchParams();
      unloadedHandles.forEach(handle => params.append('handles', handle));
      
      const response = await fetch(`/api/products?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const products = await response.json();
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid response format from products API');
      }
      
      setStateRef.current(prev => {
        const updatedProducts = new Map(prev.products);
        const updatedLoadingHandles = new Set(prev.loadingHandles);
        
        products.forEach(product => {
          updatedProducts.set(product.handle, product);
          updatedLoadingHandles.delete(product.handle);
        });
        
        // Remove any handles that didn't return products (they might not exist)
        unloadedHandles.forEach(handle => {
          updatedLoadingHandles.delete(handle);
        });
        
        return {
          ...prev,
          products: updatedProducts,
          loadingHandles: updatedLoadingHandles,
        };
      });
    } catch (error) {
      // Only log if not aborted
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error in fetchProductsByHandles:', error);
        setStateRef.current(prev => {
          // Clear loading state for these handles
          const updatedLoadingHandles = new Set(prev.loadingHandles);
          handles.forEach(handle => updatedLoadingHandles.delete(handle));
          
          return { 
            ...prev, 
            loadingHandles: updatedLoadingHandles,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
          };
        });
      }
    }
  }, []); // No dependencies needed as we use stateRef instead of direct state access
  
  // Check if a product is currently being loaded
  const isProductLoading = useCallback((handle: string | null) => {
    if (!handle) return false;
    return state.loadingHandles.has(handle);
  }, [state.loadingHandles]);
  
  // Load the next batch of products
  const loadNextBatch = useCallback(async (): Promise<boolean> => {
    // Get latest state to avoid stale closures
    let currentState: ProductCacheState;
    setState(prev => {
      currentState = prev;
      return prev; // No actual update
    });
    
    // If we don't have a cursor, or loading is complete, then there are no more batches
    if (!currentState!.currentCursor || currentState!.isLoadingComplete) {
      return false;
    }
    
    // If we're already loading a batch, don't start another one
    if (currentState!.isLoadingBatch) {
      return true; // Indicate there might be more batches, but we're already loading
    }
    
    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Set loading state
    setStateRef.current(prev => ({ ...prev, isLoadingBatch: true }));
    
    try {
      // Load the next batch of products
      const response = await fetch(`/api/products/batch?limit=25&cursor=${encodeURIComponent(currentState!.currentCursor || '')}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product batch: ${response.status}`);
      }
      
      const data = await response.json();
      const { products, nextCursor, hasNextPage } = data;
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid response format from products batch API');
      }
      
      setStateRef.current(prev => {
        const updatedProducts = new Map(prev.products);
        
        products.forEach(product => {
          updatedProducts.set(product.handle, product);
        });
        
        return {
          ...prev,
          products: updatedProducts,
          isLoadingBatch: false,
          currentCursor: nextCursor,
          isLoadingComplete: !hasNextPage,
          batchesLoaded: prev.batchesLoaded + 1,
          totalProductsLoaded: prev.totalProductsLoaded + products.length,
        };
      });
      
      // Return if there are more batches to load
      return hasNextPage;
    } catch (error) {
      // Only log if not aborted
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error in loadNextBatch:', error);
        
        // Increment retry counter
        currentRetriesRef.current += 1;
        
        // Update state to reflect error but DO NOT set isLoadingComplete
        // so that we can continue trying to load products
        setStateRef.current(prev => ({
          ...prev,
          isLoadingBatch: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred loading products',
        }));
      }
      
      // Return true to indicate we should try again, but only if we haven't reached max retries
      return currentRetriesRef.current < maxRetriesRef.current;
    }
  }, []); // No dependencies needed as we use ref for latest state

  // Background loading process with automatic retry
  const startBackgroundLoading = useCallback(async () => {
    // Use stateRef to avoid unnecessary dependencies
    if (stateRef.current.isBackgroundLoading || stateRef.current.isLoadingComplete) {
      return;
    }
    
    console.log('Starting background product loading process');
    
    // Reset retry counter
    currentRetriesRef.current = 0;
    
    // Set background loading flag
    setStateRef.current(prev => ({ ...prev, isBackgroundLoading: true }));
    
    // Create a local recursive function that uses setState callback to get latest state
    const loadBatchesRecursively = async () => {
      // Use a closure variable to track the latest background loading state
      let isCurrentlyLoading = true;
      let currentTotalLoaded = 0;
      
      // Get the latest state values before making the request
      setStateRef.current(prev => {
        isCurrentlyLoading = prev.isBackgroundLoading;
        currentTotalLoaded = prev.totalProductsLoaded;
        return prev; // No state update, just reading
      });
      
      // Only proceed if we're still in background loading mode
      if (!isCurrentlyLoading) {
        return;
      }
      
      // Load the next batch of products
      const hasMore = await loadNextBatch();
      
      // Get updated loading state again
      setStateRef.current(prev => {
        isCurrentlyLoading = prev.isBackgroundLoading;
        return prev; // No state update, just reading
      });
      
      // If there are more batches, continue with a consistent delay
      if (hasMore && isCurrentlyLoading) {
        // Use a consistent delay to ensure we don't hammer the API
        setTimeout(loadBatchesRecursively, 1000);
      } else {
        // No more batches or background loading was stopped
        console.log(`Background loading complete. Total products loaded: ${currentTotalLoaded}`);
        setStateRef.current(prev => ({ 
          ...prev, 
          isBackgroundLoading: false,
          isLoadingComplete: !hasMore // Only set as complete if there are no more products
        }));
      }
    };
    
    // Start the loading process
    loadBatchesRecursively();
  }, []); // No dependencies needed as we use stateRef for latest state

  // Create the context value with memoized methods
  const value = {
    state,
    
    // Core product management methods
    getProduct,
    preloadProducts,
    fetchProductsByHandles,
    resetCache,
    isProductLoading,
    
    // Core progressive batch loading functions
    startBackgroundLoading,
    loadNextBatch,
  };

  // Clean up any in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

// Custom hook to use product cache context
export const useProductCache = () => useContext(ProductContext);
