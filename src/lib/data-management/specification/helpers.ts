/**
 * Helper functions for specification data management
 */
import { ShopifyProduct } from '../types';
import { SpecificationWithProduct } from './types';

/**
 * Sort specifications by their completeness percentage
 * @param specifications - Array of specifications to sort
 * @returns Sorted array of specifications
 */
export function sortSpecificationsByCompleteness(
  specifications: SpecificationWithProduct[]
): SpecificationWithProduct[] {
  return [...specifications].sort((a, b) => {
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
}

/**
 * Extract Shopify handles from specifications that need products
 * @param specifications - Array of specifications to extract handles from
 * @returns Array of Shopify product handles
 */
export function extractProductHandlesToFetch(
  specifications: SpecificationWithProduct[]
): string[] {
  return specifications
    .filter(spec => !spec.product && spec.shopify_handle)
    .map(spec => spec.shopify_handle as string);
}

/**
 * Enrich specifications with product data
 * @param specifications - Raw specifications from the API
 * @param getProduct - Function to get a product by its handle
 * @returns Specifications with product data
 */
export function enrichSpecificationsWithProducts(
  specifications: SpecificationWithProduct[],
  getProduct: (handle: string | null) => ShopifyProduct | undefined
): SpecificationWithProduct[] {
  return specifications.map(spec => {
    const product = getProduct(spec.shopify_handle);
    return {
      ...spec,
      product, // Will be undefined if not found
      isProductLoading: !product && spec.shopify_handle ? true : false,
    };
  });
}

/**
 * Split product handles into visible and remaining handles
 * @param specifications - Array of specifications
 * @param visibleCount - Number of specs considered visible
 * @returns Object containing visible and remaining handles
 */
export function splitProductHandlesForLoading(
  specifications: SpecificationWithProduct[],
  visibleCount = 8
): { visibleHandles: string[]; remainingHandles: string[] } {
  const allHandlesToFetch = extractProductHandlesToFetch(specifications);
  
  const visibleHandles = extractProductHandlesToFetch(
    specifications.slice(0, visibleCount)
  );
  
  const remainingHandles = allHandlesToFetch.filter(
    handle => !visibleHandles.includes(handle)
  );
  
  return { visibleHandles, remainingHandles };
}
