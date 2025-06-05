'use client';

import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { Specification, ShopifyProduct } from '../types';
import { 
  SpecificationCacheState, 
  SpecificationContextType,
  SpecificationWithProduct
} from './types';
import { useProductCache } from '../productCache';
import { 
  enrichSpecificationsWithProducts,
  splitProductHandlesForLoading 
} from './helpers';
import { 
  hasRelevantProductChanges, 
  updateSpecificationsFromProductChanges,
  createProductCacheSnapshot
} from './state-management';

// Default context value
const defaultSpecificationCacheState: SpecificationCacheState = {
  specifications: [],
  isLoading: false,
  error: null,
};

const defaultSpecificationContext: SpecificationContextType = {
  state: defaultSpecificationCacheState,
  fetchSpecifications: async () => { return; },
  getSpecificationsSortedByCompleteness: () => [],
  resetCache: () => {},
};

// Create context
export const SpecificationContext = createContext<SpecificationContextType>(defaultSpecificationContext);

// Specification context provider
export function SpecificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpecificationCacheState>(defaultSpecificationCacheState);
  const { 
    state: productState, 
    getProduct: productGetProduct, 
    fetchProductsByHandles 
  } = useProductCache();
  
  // Use a ref to track the previous product state to prevent unnecessary updates
  const prevProductStateRef = useRef(createProductCacheSnapshot(productState));

  // Create a stable version of getProduct that won't change on each render
  const getProduct = useCallback((handle: string | null): ShopifyProduct | undefined => {
    if (!handle) return undefined;
    // Pass through the product as is (undefined or ShopifyProduct)
    return productGetProduct(handle);
  }, [productGetProduct]); 
  
  // Reset cache
  const resetCache = useCallback(() => {
    setState(defaultSpecificationCacheState);
  }, []);

  // Fetch specifications for a user
  const fetchSpecifications = useCallback(async (userId: string) => {
    // Cancel any previous requests
    const abortController = new AbortController();
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/specifications?userId=${userId}`, {
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch specifications: ${response.status}`);
      }
      
      const specifications: Specification[] = await response.json();
      
      // Transform specifications to include product data if available
      const specificationsWithProduct = enrichSpecificationsWithProducts(
        specifications as SpecificationWithProduct[],
        getProduct
      );
      
      setState({
        specifications: specificationsWithProduct,
        isLoading: false,
        error: null,
      });
      
      // Split handles for priority loading
      const { visibleHandles, remainingHandles } = splitProductHandlesForLoading(
        specificationsWithProduct
      );
      
      // Fetch visible products with priority
      if (visibleHandles.length > 0) {
        fetchProductsByHandles(visibleHandles);
      }
      
      // Fetch remaining products if needed
      if (remainingHandles.length > 0) {
        fetchProductsByHandles(remainingHandles);
      }
    } catch (error: unknown) {
      // Only update error state if not aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      } else if (error !== null && error !== undefined) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'An unknown error occurred',
        }));
      }
    }
    
    // We don't need to return a cleanup function from this callback
    abortController.abort();
    return;
  }, [getProduct, fetchProductsByHandles]);
  
  // Helper function to check if product state has relevant changes for our specifications
  const checkForRelevantChanges = useCallback(() => {
    return hasRelevantProductChanges(
      state, 
      productState, 
      prevProductStateRef.current
    );
  }, [state, productState]);

  // Store setState and getProduct in refs to prevent unnecessary re-renders
  const setStateRef = useRef(setState);
  const getProductRef = useRef(getProduct);
  
  // Update refs when functions change
  useEffect(() => {
    setStateRef.current = setState;
    getProductRef.current = getProduct;
  }, [setState, getProduct]);

  // Update specifications when product cache changes, with better dependency management
  useEffect(() => {
    // Skip if no specifications or no relevant product changes
    if (state.specifications.length === 0 || !checkForRelevantChanges()) {
      // Still update the ref for future comparisons
      prevProductStateRef.current = createProductCacheSnapshot(productState);
      return;
    }
    
    // Update specifications based on product changes - using refs to prevent circular dependencies
    updateSpecificationsFromProductChanges(setStateRef.current, getProductRef.current, productState);
    
    // Update ref with current state for future comparisons
    prevProductStateRef.current = createProductCacheSnapshot(productState);
  }, [productState, checkForRelevantChanges, state.specifications.length]);

  return (
    <SpecificationContext.Provider
      value={{
        state,
        fetchSpecifications,
        getSpecificationsSortedByCompleteness: useCallback(() => {
          return [...state.specifications].sort((a, b) => {
            // Prioritize specifications with products
            if (!!a.product !== !!b.product) {
              return a.product ? -1 : 1;
            }
            
            // Sort by completeness percent if available
            if (
              typeof a.completion_percent === 'number' &&
              typeof b.completion_percent === 'number'
            ) {
              // Sort in descending order (highest completion first)
              return b.completion_percent - a.completion_percent;
            }
            
            // Fall back to sorting by ID if completeness is not available
            return a.id.localeCompare(b.id);
          });
        }, [state.specifications]),
        resetCache
      }}
    >
      {children}
    </SpecificationContext.Provider>
  );
}
