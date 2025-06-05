'use client';

import { useContext, useMemo } from 'react';
import { SpecificationContext } from './context';
import { SpecificationWithProduct } from './types';
import { sortSpecificationsByCompleteness } from './helpers';

/**
 * Hook to access the specification cache context
 * @returns The specification context
 */
export function useSpecificationCache() {
  return useContext(SpecificationContext);
}

/**
 * Hook to get specifications sorted by completeness
 * @returns Sorted array of specifications
 */
export function useSpecificationsSortedByCompleteness(): SpecificationWithProduct[] {
  const { state } = useSpecificationCache();
  
  // Use useMemo to avoid recalculating on every render
  return useMemo(() => {
    return sortSpecificationsByCompleteness(state.specifications);
  }, [state.specifications]);
}

/**
 * Hook to filter specifications by completion status
 * @param minCompletion - Minimum completion percentage (0-100)
 * @returns Filtered array of specifications
 */
export function useFilteredSpecifications(minCompletion: number = 0): {
  specifications: SpecificationWithProduct[];
  isLoading: boolean;
  isEmpty: boolean;
} {
  const { state } = useSpecificationCache();
  
  const filteredSpecs = useMemo(() => {
    return state.specifications.filter(spec => {
      if (typeof spec.completion_percent !== 'number') {
        return minCompletion === 0; // Only include if we're not filtering
      }
      return spec.completion_percent >= minCompletion;
    });
  }, [state.specifications, minCompletion]);
  
  return {
    specifications: filteredSpecs,
    isLoading: state.isLoading,
    isEmpty: !state.isLoading && filteredSpecs.length === 0
  };
}

/**
 * Hook to get a single specification by ID
 * @param specificationId - The ID of the specification to retrieve
 * @returns The specification or null if not found
 */
export function useSpecification(specificationId: string): {
  specification: SpecificationWithProduct | null;
  isLoading: boolean;
  error: string | null;
} {
  const { state } = useSpecificationCache();
  
  const specification = useMemo(() => {
    return state.specifications.find(spec => spec.id === specificationId) || null;
  }, [state.specifications, specificationId]);
  
  return {
    specification,
    isLoading: state.isLoading || (specification?.isProductLoading || false),
    error: state.error
  };
}
