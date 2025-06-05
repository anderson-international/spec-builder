/**
 * Specification-specific types for the data management layer
 */
import { ShopifyProduct, Specification } from '../types';

/**
 * A specification enriched with its associated product
 */
export interface SpecificationWithProduct extends Specification {
  product?: ShopifyProduct; // Using optional property to match original type
  isProductLoading?: boolean; // Make optional to match original type
  completion_percent?: number; // Added to match usage in code
}

/**
 * The state of the specification cache
 */
export interface SpecificationCacheState {
  specifications: SpecificationWithProduct[];
  isLoading: boolean;
  error: string | null;
}

/**
 * The specification context type
 */
export interface SpecificationContextType {
  state: SpecificationCacheState;
  fetchSpecifications: (userId: string) => Promise<void>;
  getSpecificationsSortedByCompleteness: () => SpecificationWithProduct[];
  resetCache: () => void;
}
