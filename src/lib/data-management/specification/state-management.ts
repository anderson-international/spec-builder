/**
 * State management functions for specifications
 */
import { Dispatch, SetStateAction } from 'react';
import { ShopifyProduct } from '../types';
import { SpecificationCacheState, SpecificationWithProduct } from './types';
import { enrichSpecificationsWithProducts } from './helpers';

/**
 * ProductCacheState representation for comparison
 */
interface ProductCacheSnapshot {
  products: Map<string, ShopifyProduct>;
  loadingHandles: Set<string>;
}

/**
 * Check if there are relevant product changes for specifications
 * @param specState - Current specification state
 * @param productState - Current product state
 * @param prevProductState - Previous product state for comparison
 * @returns boolean indicating if updates are needed
 */
export function hasRelevantProductChanges(
  specState: SpecificationCacheState,
  productState: { products: Map<string, ShopifyProduct>; loadingHandles: Set<string> },
  prevProductState: ProductCacheSnapshot
): boolean {
  if (specState.specifications.length === 0) return false;
  
  // Check if there are any products that became available for our specifications
  for (const spec of specState.specifications) {
    if (!spec.product && spec.shopify_handle) {
      // If product wasn't available before but is now, that's relevant
      if (!prevProductState.products.has(spec.shopify_handle) && 
          productState.products.has(spec.shopify_handle)) {
        return true;
      }
      
      // If loading state changed, that's relevant
      const wasLoading = prevProductState.loadingHandles.has(spec.shopify_handle);
      const isNowLoading = productState.loadingHandles.has(spec.shopify_handle);
      if (wasLoading !== isNowLoading) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Update specifications based on product cache changes
 * @param setState - State setter function for specification state
 * @param getProduct - Function to get product by handle
 * @param productState - Current product cache state
 * @returns Whether any updates were made
 */
export function updateSpecificationsFromProductChanges(
  setState: Dispatch<SetStateAction<SpecificationCacheState>>,
  getProduct: (handle: string | null) => ShopifyProduct | undefined,
  productState: { products: Map<string, ShopifyProduct>; loadingHandles: Set<string> }
): boolean {
  let hasChanges = false;
  
  setState(prev => {
    const updatedSpecs = prev.specifications.map(spec => {
      // If we already have a product or it's not loading, return as is
      if (spec.product || !spec.isProductLoading) return spec;
      
      // Check if the product is now available in the cache
      const product = getProduct(spec.shopify_handle);
      if (product) {
        hasChanges = true;
        return {
          ...spec,
          product,
          isProductLoading: false,
        };
      }
      
      // Check if loading status changed
      const isLoading = productState.loadingHandles.has(spec.shopify_handle);
      if (spec.isProductLoading !== isLoading) {
        hasChanges = true;
        return {
          ...spec,
          isProductLoading: isLoading,
        };
      }
      
      return spec;
    });
    
    // Only update state if something actually changed
    return hasChanges ? {
      ...prev,
      specifications: updatedSpecs,
    } : prev;
  });
  
  return hasChanges;
}

/**
 * Create a snapshot of the product cache state for comparison
 * @param productState - Product cache state to snapshot
 * @returns ProductCacheSnapshot for future comparison
 */
export function createProductCacheSnapshot(
  productState: { products: Map<string, ShopifyProduct>; loadingHandles: Set<string> }
): ProductCacheSnapshot {
  return {
    products: new Map(productState.products),
    loadingHandles: new Set(productState.loadingHandles)
  };
}
