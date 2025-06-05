/**
 * Specification data management module
 */

// Re-export types
export * from './types';

// Re-export context
export { SpecificationContext, SpecificationProvider } from './context';

// Re-export hooks
export {
  useSpecificationCache,
  useSpecificationsSortedByCompleteness,
  useFilteredSpecifications,
  useSpecification
} from './hooks';

// Re-export helpers for advanced usage
export {
  sortSpecificationsByCompleteness,
  enrichSpecificationsWithProducts,
  extractProductHandlesToFetch
} from './helpers';
