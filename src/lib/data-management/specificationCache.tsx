'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  SpecificationCacheState, 
  SpecificationContextType,
  Specification,
  SpecificationWithProduct
} from '@/lib/data-management/types';
import { useProductCache } from '@/lib/data-management/productCache';

// Default context value
const defaultSpecificationCacheState: SpecificationCacheState = {
  specifications: [],
  isLoading: false,
  error: null,
};

const defaultSpecificationContext: SpecificationContextType = {
  state: defaultSpecificationCacheState,
  fetchSpecifications: async () => {},
  getSpecificationsSortedByCompleteness: () => [],
  resetCache: () => {},
};

// Create context
export const SpecificationContext = createContext<SpecificationContextType>(defaultSpecificationContext);

// Specification context provider
export function SpecificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpecificationCacheState>(defaultSpecificationCacheState);
  const { getProduct, fetchProductsByHandles } = useProductCache();
  
  // Reset cache
  const resetCache = useCallback(() => {
    setState(defaultSpecificationCacheState);
  }, []);

  // Fetch specifications for a user
  const fetchSpecifications = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/specifications?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch specifications: ${response.status}`);
      }
      
      const specifications: Specification[] = await response.json();
      
      // Transform specifications to include product data if available
      const specificationsWithProduct: SpecificationWithProduct[] = specifications.map(spec => {
        const product = getProduct(spec.shopify_handle);
        
        return {
          ...spec,
          product,
          isProductLoading: !product, // Mark as loading if product isn't in cache
        };
      });
      
      setState({
        specifications: specificationsWithProduct,
        isLoading: false,
        error: null,
      });
      
      // Extract handles that need to be fetched with priority
      const visibleSpecHandles = specificationsWithProduct
        .slice(0, 8) // Assume first 8 specs are visible in viewport
        .filter(spec => !spec.product)
        .map(spec => spec.shopify_handle);
        
      // Fetch visible products with priority
      if (visibleSpecHandles.length > 0) {
        fetchProductsByHandles(visibleSpecHandles);
      }
      
      // Get all handles that need to be fetched
      const allHandlesToFetch = specificationsWithProduct
        .filter(spec => !spec.product)
        .map(spec => spec.shopify_handle);
        
      if (allHandlesToFetch.length > 0 && allHandlesToFetch.length !== visibleSpecHandles.length) {
        // Fetch the remaining non-visible handles
        const remainingHandles = allHandlesToFetch.filter(
          handle => !visibleSpecHandles.includes(handle)
        );
        fetchProductsByHandles(remainingHandles);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
    }
  }, [getProduct, fetchProductsByHandles]);

  // Update specifications when product cache changes
  const { state: productState } = useProductCache();
  useEffect(() => {
    if (state.specifications.length === 0) return;
    
    // Update specifications with newly loaded products
    setState(prev => {
      const updatedSpecs = prev.specifications.map(spec => {
        // If we already have a product or it's not loading, return as is
        if (spec.product || !spec.isProductLoading) return spec;
        
        // Check if the product is now available in the cache
        const product = getProduct(spec.shopify_handle);
        if (product) {
          return {
            ...spec,
            product,
            isProductLoading: false,
          };
        }
        
        // Check if loading
        const isLoading = productState.loadingHandles.has(spec.shopify_handle);
        
        if (!isLoading) {
          // Mark as not loading if it's not in loading state
          return {
            ...spec,
            isProductLoading: false,
          };
        }
        
        return spec;
      });
      
      return {
        ...prev,
        specifications: updatedSpecs,
      };
    });
  }, [productState.products, productState.loadingHandles, getProduct, state.specifications.length]);

  // Sort specifications by completeness (products loaded first) with proper memoization
  const [sortedSpecifications, setSortedSpecifications] = useState<SpecificationWithProduct[]>([]);
  
  // Update sorted specifications when the underlying specifications change
  useEffect(() => {
    const sorted = [...state.specifications].sort((a, b) => {
      // First sort by product availability
      if (a.product && !b.product) return -1;
      if (!a.product && b.product) return 1;
      
      // Then by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    setSortedSpecifications(sorted);
  }, [state.specifications]);
  
  // Return the memoized sorted specifications
  const getSpecificationsSortedByCompleteness = useCallback(() => {
    return sortedSpecifications;
  }, [sortedSpecifications]);

  return (
    <SpecificationContext.Provider
      value={{
        state,
        fetchSpecifications,
        getSpecificationsSortedByCompleteness,
        resetCache,
      }}
    >
      {children}
    </SpecificationContext.Provider>
  );
}

// Custom hook to use specification cache context
export const useSpecificationCache = () => useContext(SpecificationContext);
