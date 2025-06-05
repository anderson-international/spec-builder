'use client';

/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import directly from '@/lib/data-management/specification' instead.
 */

// Re-export everything from the new modular structure
export {
  // Context and Provider
  SpecificationContext,
  SpecificationProvider,
  
  // Hooks
  useSpecificationCache,
  useSpecificationsSortedByCompleteness,
  useFilteredSpecifications,
  useSpecification,
  
  // Types
  type SpecificationCacheState,
  type SpecificationContextType,
  type SpecificationWithProduct
} from '@/lib/data-management/specification';
