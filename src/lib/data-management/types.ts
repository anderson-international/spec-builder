// Data management layer type definitions
import { User } from '@/lib/auth/types';

// Product Types
export interface ShopifyProductImage {
  url: string;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  brand?: string;
  featuredImage?: ShopifyProductImage;
  onlineStoreUrl?: string;
}

export interface ProductCacheState {
  products: Map<string, ShopifyProduct>;
  loadingHandles: Set<string>;
  isLoadingBatch: boolean;
  error: string | null;
  
  // Progressive batch loading properties
  currentCursor?: string;          // Current cursor for batch pagination
  isBackgroundLoading: boolean;    // Whether background loading is active
  isLoadingComplete: boolean;      // Whether all products are loaded
  batchesLoaded: number;           // Number of batches successfully loaded
  totalProductsLoaded: number;     // Total number of products loaded
}

// Specification Types
export interface SpecificationRelation {
  id: string;
  name: string;
}

export interface TastingNoteRelation {
  tasting_note: SpecificationRelation;
}

export interface TobaccoTypeRelation {
  tobacco_type: SpecificationRelation;
}

export interface CureRelation {
  cure: SpecificationRelation;
}

export interface Specification {
  id: string;
  shopify_handle: string;
  review: string | null;
  star_rating: number | null;
  created_at: string;
  updated_at: string;
  product_type: SpecificationRelation | null;
  product_brand: SpecificationRelation | null;
  tasting_notes: TastingNoteRelation[];
  grind: SpecificationRelation | null;
  moisture_level: SpecificationRelation | null;
  nicotine_level: SpecificationRelation | null;
  experience_level: SpecificationRelation | null;
  tobacco_types: TobaccoTypeRelation[];
  cures: CureRelation[];
}

export interface SpecificationWithProduct extends Specification {
  product?: ShopifyProduct;
  isProductLoading?: boolean;
}

export interface SpecificationCacheState {
  specifications: SpecificationWithProduct[];
  isLoading: boolean;
  error: string | null;
}

// Loading State
export interface LoadingState {
  isLoadingUsers: boolean;
  isLoadingSpecifications: boolean;
  isLoadingProducts: boolean;
  isLoadingBrands: boolean;
}

// Context Types
export interface ProductContextType {
  state: ProductCacheState;
  getProduct: (handle: string) => ShopifyProduct | undefined;
  preloadProducts: (userId?: string) => Promise<void>;
  fetchProductsByHandles: (handles: string[]) => Promise<void>;
  resetCache: () => void;
  isProductLoading: (handle: string) => boolean;
  
  // Core progressive batch loading functions
  startBackgroundLoading: () => Promise<void>;
  loadNextBatch: (batchSize?: number) => Promise<boolean>;
}

export interface SpecificationContextType {
  state: SpecificationCacheState;
  fetchSpecifications: (userId: string) => Promise<void>;
  getSpecificationsSortedByCompleteness: () => SpecificationWithProduct[];
  resetCache: () => void;
}

export interface LoadingContextType {
  loadingState: LoadingState;
  setLoadingUsers: (isLoading: boolean) => void;
  setLoadingSpecifications: (isLoading: boolean) => void;
  setLoadingProducts: (isLoading: boolean) => void;
  setLoadingBrands: (isLoading: boolean) => void;
}
