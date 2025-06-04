'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  ProductCacheState, 
  ProductContextType, 
  ShopifyProduct 
} from '@/lib/data-management/types';

// Default context value
const defaultProductCacheState: ProductCacheState = {
  products: new Map<string, ShopifyProduct>(),
  loadingHandles: new Set<string>(),
  failedHandles: new Map<string, number>(), // Map of handle to retry count
  isLoadingBatch: false,
  error: null,
  
  // Progressive batch loading properties
  currentCursor: undefined,
  isBackgroundLoading: false,
  isLoadingComplete: false,
  failedBatches: 0,
};

const defaultProductContext: ProductContextType = {
  state: defaultProductCacheState,
  getProduct: () => undefined,
  preloadProducts: async () => {},
  fetchProductsByHandles: async () => {},
  resetCache: () => {},
  isProductLoading: () => false,
  didProductFail: () => false,
  getFailedRetryCount: () => 0,
  retryFailedProducts: () => {},
  
  // Core progressive batch loading functions
  startBackgroundLoading: async () => {},
  loadNextBatch: async () => false,
};

// Create context
export const ProductContext = createContext<ProductContextType>(defaultProductContext);

// Product context provider
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProductCacheState>(defaultProductCacheState);

  // Get a product by handle
  const getProduct = useCallback((handle: string) => {
    return state.products.get(handle);
  }, [state.products]);

  // Reset cache
  const resetCache = useCallback(() => {
    setState(defaultProductCacheState);
  }, []);

  // Preload initial batch of products
  const preloadProducts = useCallback(async (userId?: string) => {
    // This function is now for INITIAL loading only, not for tab switching
    // If we already have products loaded or are currently loading, don't do anything
    if (state.isLoadingBatch || state.products.size > 0) return;
    
    setState(prev => ({ ...prev, isLoadingBatch: true, error: null }));

    try {
      // Load the first batch of products using the batch API
      const response = await fetch('/api/products/batch?limit=25');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch initial product batch: ${response.status}`);
      }
      
      const data = await response.json();
      const { products, nextCursor, hasNextPage } = data;
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid response format from products batch API');
      }
      
      // Update cache with initial set of products
      setState(prev => {
        const updatedProducts = new Map(prev.products);
        const updatedLoadingHandles = new Set(prev.loadingHandles);
        const updatedFailedHandles = new Map(prev.failedHandles);
        
        products.forEach(product => {
          updatedProducts.set(product.handle, product);
          updatedLoadingHandles.delete(product.handle);
          updatedFailedHandles.delete(product.handle);
        });
        
        return {
          ...prev,
          products: updatedProducts,
          loadingHandles: updatedLoadingHandles,
          failedHandles: updatedFailedHandles,
          isLoadingBatch: false,
          currentCursor: nextCursor,
          isLoadingComplete: !hasNextPage,
          failedBatches: 0,
        };
      });
      
      // Automatically start background loading after a short delay if needed
      const shouldStartBackgroundLoading = hasNextPage;
      if (shouldStartBackgroundLoading) {
        setTimeout(() => {
          // This will be picked up by the startBackgroundLoading effect
          setState(prev => ({ ...prev, isBackgroundLoading: true }));
        }, 500);
      }
    } catch (error) {
      console.error('Error in preloadProducts:', error);
      setState(prev => ({ 
        ...prev, 
        isLoadingBatch: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }));
    }
  }, [state.isLoadingBatch, state.products.size]);

  // Fetch specific products by handles (high priority)
  const fetchProductsByHandles = useCallback(async (handles: string[]) => {
    if (!handles.length) return;
    
    // Filter out handles that are already loaded or currently loading
    const handlesToFetch = handles.filter(handle => 
      !state.products.has(handle) && 
      !state.loadingHandles.has(handle) &&
      !state.failedHandles.has(handle) // Also skip previously failed handles
    );
    
    if (!handlesToFetch.length) return;
    
    // Mark handles as loading
    setState(prev => {
      const updatedLoadingHandles = new Set(prev.loadingHandles);
      handlesToFetch.forEach((handle: string) => updatedLoadingHandles.add(handle));
      
      return {
        ...prev,
        loadingHandles: updatedLoadingHandles,
      };
    });
    
    try {
      // We'll create a new API endpoint to fetch products by handles
      const response = await fetch('/api/products/byHandles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handles: handlesToFetch }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products by handles: ${response.status}`);
      }
      
      const products: ShopifyProduct[] = await response.json();
      
      // Update the cache with fetched products
      setState(prev => {
        const updatedProducts = new Map(prev.products);
        const updatedLoadingHandles = new Set(prev.loadingHandles);
        const updatedFailedHandles = new Map(prev.failedHandles);
        
        // Add successfully fetched products to cache
        products.forEach(product => {
          updatedProducts.set(product.handle, product);
          updatedLoadingHandles.delete(product.handle);
          updatedFailedHandles.delete(product.handle);
        });
        
        // Mark handles that weren't returned as failed
        const fetchedHandles = new Set(products.map(p => p.handle));
        handlesToFetch.forEach((handle: string) => {
          if (!fetchedHandles.has(handle)) {
            updatedLoadingHandles.delete(handle);
            const currentRetries = updatedFailedHandles.get(handle) || 0;
            updatedFailedHandles.set(handle, currentRetries + 1);
          }
        });
        
        return {
          ...prev,
          products: updatedProducts,
          loadingHandles: updatedLoadingHandles,
          failedHandles: updatedFailedHandles,
        };
      });
    } catch (error) {
      // Mark all handles as failed
      setState(prev => {
        const updatedLoadingHandles = new Set(prev.loadingHandles);
        const updatedFailedHandles = new Map(prev.failedHandles);
        
        handlesToFetch.forEach((handle: string) => {
          updatedLoadingHandles.delete(handle);
          const currentRetries = updatedFailedHandles.get(handle) || 0;
          updatedFailedHandles.set(handle, currentRetries + 1);
        });
        
        return {
          ...prev,
          loadingHandles: updatedLoadingHandles,
          failedHandles: updatedFailedHandles,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
      });
    }
  }, [state.products, state.loadingHandles, state.failedHandles]);

  // Check if a product is currently loading
  const isProductLoading = useCallback((handle: string) => {
    return state.loadingHandles.has(handle);
  }, [state.loadingHandles]);

  // Check if a product failed to load
  const didProductFail = useCallback((handle: string) => {
    return state.failedHandles.has(handle);
  }, [state.failedHandles]);

  // Get retry count for a failed product
  const getFailedRetryCount = useCallback((handle: string) => {
    return state.failedHandles.get(handle) || 0;
  }, [state.failedHandles]);

  // Retry loading failed products
  const retryFailedProducts = useCallback(() => {
    const failedHandles = Array.from(state.failedHandles.keys());
    
    if (failedHandles.length > 0) {
      fetchProductsByHandles(failedHandles);
    }
  }, [state.failedHandles, fetchProductsByHandles]);

  // Load a single batch of products using cursor pagination
  const loadNextBatch = useCallback(async (batchSize: number = 25): Promise<boolean> => {
    // If loading is complete or we're currently loading, don't do anything
    if (state.isLoadingComplete || state.isLoadingBatch) {
      return false;
    }
    
    setState(prev => ({ ...prev, isLoadingBatch: true }));
    
    try {
      // Construct URL with cursor if available
      const url = `/api/products/batch?limit=${batchSize}${state.currentCursor ? `&cursor=${encodeURIComponent(state.currentCursor)}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product batch: ${response.status}`);
      }
      
      const data = await response.json();
      const { products, nextCursor, hasNextPage } = data;
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid response format from products batch API');
      }
      
      // Update cache with fetched products
      setState(prev => {
        const updatedProducts = new Map(prev.products);
        const updatedLoadingHandles = new Set(prev.loadingHandles);
        const updatedFailedHandles = new Map(prev.failedHandles);
        
        products.forEach(product => {
          updatedProducts.set(product.handle, product);
          updatedLoadingHandles.delete(product.handle);
          updatedFailedHandles.delete(product.handle);
        });
        
        return {
          ...prev,
          products: updatedProducts,
          loadingHandles: updatedLoadingHandles,
          failedHandles: updatedFailedHandles,
          isLoadingBatch: false,
          currentCursor: nextCursor,
          isLoadingComplete: !hasNextPage,
          failedBatches: 0, // Reset failure count on successful batch
        };
      });
      
      return hasNextPage; // Return whether there are more batches to load
    } catch (error) {
      console.error('Error loading product batch:', error);
      
      // Update state to reflect error and increment failure count
      setState(prev => ({
        ...prev,
        isLoadingBatch: false,
        failedBatches: prev.failedBatches + 1,
        error: error instanceof Error ? error.message : 'An unknown error occurred loading products',
      }));
      
      return false; // Error occurred, consider the batch failed
    }
  }, [state.currentCursor, state.isLoadingComplete, state.isLoadingBatch]);

  // Background loading process with automatic retry and backoff
  const startBackgroundLoading = useCallback(async () => {
    // If background loading is already active or loading is complete, don't do anything
    if (state.isBackgroundLoading || state.isLoadingComplete) {
      return;
    }
    
    // Set background loading flag
    setState(prev => ({ ...prev, isBackgroundLoading: true }));
    
    // Load batches recursively in the background
    const loadBatchesRecursively = async () => {
      // Load the next batch of products
      const hasMore = await loadNextBatch();
      
      // If there are more batches, continue with a delay based on failure count
      if (hasMore && state.isBackgroundLoading) {
        // Use exponential backoff strategy based on failure count
        const delay = Math.min(1000 * Math.pow(2, state.failedBatches), 30000);
        setTimeout(loadBatchesRecursively, delay);
      } else {
        // No more batches or background loading was stopped
        setState(prev => ({ ...prev, isBackgroundLoading: false }));
      }
    };
    
    // Start the loading process
    loadBatchesRecursively();
  }, [loadNextBatch, state.isBackgroundLoading, state.isLoadingComplete, state.failedBatches]);

  // Removed unnecessary control functions (pauseBackgroundLoading, resumeBackgroundLoading, getLoadingProgress)

  return (
    <ProductContext.Provider
      value={{
        state,
        getProduct,
        preloadProducts,
        fetchProductsByHandles,
        resetCache,
        isProductLoading,
        didProductFail,
        getFailedRetryCount,
        retryFailedProducts,
        startBackgroundLoading,
        loadNextBatch
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

// Custom hook to use product cache context
export const useProductCache = () => useContext(ProductContext);
