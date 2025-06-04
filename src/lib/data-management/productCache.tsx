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
          batchesLoaded: 1,
          totalProductsLoaded: products.length,
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
    if (!handles?.length) return;
    
    // Mark all handles as loading
    setState(prev => {
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
      const unloadedHandles = handles.filter(handle => !state.products.has(handle));
      
      if (unloadedHandles.length > 0) {
        const response = await fetch(`/api/products/byHandles?handles=${encodeURIComponent(JSON.stringify(unloadedHandles))}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products by handles: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data.products)) {
          throw new Error('Invalid response format from products handles API');
        }
        
        // Update cache with fetched products
        setState(prev => {
          const updatedProducts = new Map(prev.products);
          const updatedLoadingHandles = new Set(prev.loadingHandles);
          
          // Add successfully loaded products to cache
          data.products.forEach((product: ShopifyProduct) => {
            updatedProducts.set(product.handle, product);
            updatedLoadingHandles.delete(product.handle);
          });
          
          // Remove loading state for any requested but not returned handles
          unloadedHandles.forEach(handle => {
            if (!data.products.some((p: ShopifyProduct) => p.handle === handle)) {
              console.error(`Failed to load product: ${handle}`);
              updatedLoadingHandles.delete(handle);
            }
          });
          
          return {
            ...prev,
            products: updatedProducts,
            loadingHandles: updatedLoadingHandles,
          };
        });
      } else {
        // If all products are already loaded, just remove them from loading state
        setState(prev => {
          const updatedLoadingHandles = new Set(prev.loadingHandles);
          handles.forEach(handle => updatedLoadingHandles.delete(handle));
          
          return {
            ...prev,
            loadingHandles: updatedLoadingHandles
          };
        });
      }
    } catch (error) {
      console.error('Error fetching products by handles:', error);
      
      // Log error and remove handles from loading
      setState(prev => {
        const updatedLoadingHandles = new Set(prev.loadingHandles);
        
        handles.forEach(handle => {
          updatedLoadingHandles.delete(handle);
        });
        
        return {
          ...prev,
          loadingHandles: updatedLoadingHandles,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
      });
    }
  }, [state.products, state.loadingHandles]);

  // Check if a product is currently loading
  const isProductLoading = useCallback((handle: string) => {
    return state.loadingHandles.has(handle);
  }, [state.loadingHandles]);

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
      
      // Log detailed information about the batch loading attempt
      console.log(`Loading product batch with cursor: ${state.currentCursor || 'initial'}, limit: ${batchSize}, current total: ${state.totalProductsLoaded}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product batch: ${response.status}`);
      }
      
      const data = await response.json();
      const { products, nextCursor, hasNextPage } = data;
      
      if (!Array.isArray(products)) {
        throw new Error('Invalid response format from products batch API');
      }
      
      // Log success information
      console.log(`Successfully loaded batch: ${products.length} products, hasNextPage: ${hasNextPage}, total now: ${state.totalProductsLoaded + products.length}`);
      if (hasNextPage) {
        console.log(`Next cursor: ${nextCursor}`);
      }
      
      // Update cache with fetched products
      setState(prev => {
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
          batchesLoaded: prev.batchesLoaded + 1,
          totalProductsLoaded: prev.totalProductsLoaded + products.length,
          error: null, // Clear any previous errors on success
        };
      });
      
      return hasNextPage; // Return whether there are more batches to load
    } catch (error) {
      console.error('Error loading product batch:', error);
      
      // Update state to reflect error but DO NOT set isLoadingComplete
      // so that we can continue trying to load products
      setState(prev => ({
        ...prev,
        isLoadingBatch: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred loading products',
      }));
      
      // Return true to indicate we should try again, even after an error
      // This ensures batch loading continues despite temporary errors
      return true;
    }
  }, [state.currentCursor, state.isLoadingComplete, state.isLoadingBatch, state.totalProductsLoaded]);

  // Background loading process with automatic retry
  const startBackgroundLoading = useCallback(async () => {
    // If background loading is already active or loading is complete, don't do anything
    if (state.isBackgroundLoading || state.isLoadingComplete) {
      return;
    }
    
    console.log('Starting background product loading process');
    
    // Set background loading flag
    setState(prev => ({ ...prev, isBackgroundLoading: true }));
    
    // Load batches recursively in the background
    const loadBatchesRecursively = async () => {
      // Load the next batch of products
      const hasMore = await loadNextBatch();
      
      // If there are more batches, continue with a consistent delay
      if (hasMore && state.isBackgroundLoading) {
        // Use a consistent delay to ensure we load all products
        setTimeout(loadBatchesRecursively, 1000);
      } else {
        // No more batches or background loading was stopped
        console.log(`Background loading complete. Total products loaded: ${state.totalProductsLoaded}`);
        setState(prev => ({ 
          ...prev, 
          isBackgroundLoading: false,
          isLoadingComplete: !hasMore // Only set as complete if there are no more products
        }));
      }
    };
    
    // Start the loading process
    loadBatchesRecursively();
}, [loadNextBatch, state.isBackgroundLoading, state.isLoadingComplete, state.totalProductsLoaded]);

  // Create the context value with methods
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

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

// Custom hook to use product cache context
export const useProductCache = () => useContext(ProductContext);
