'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import ProductCard from '@/components/products/ProductCard';
import SpecificationCard from '@/components/specifications/SpecificationCard';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Search from '@/components/ui/Search';
import TabGroup, { Tab } from '@/components/ui/TabGroup';
import { useAuth } from '@/lib/auth/context';
import { useProductCache } from '@/lib/data-management/productCache';
import { useSpecificationCache } from '@/lib/data-management/specificationCache';
import { useLoading } from '@/lib/loading/context';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface TastingNote {
  id: number;
  name: string;
}

interface TastingNoteWrapper {
  tasting_note: TastingNote;
}

interface TobaccoType {
  id: number;
  name: string;
}

interface Cure {
  id: number;
  name: string;
}

// We use the Specification type from data-management/types.ts for all operations
// The TastingNote, TobaccoType and Cure interfaces are only needed for component props

// Tab identifiers
const TABS = {
  SPECIFICATIONS: 'specifications',
  PRODUCTS: 'products'
};

export default function SpecificationsPage() {
  const router = useRouter();
  const { startLoading, stopLoading, isLoadingSection } = useLoading();
  const { user } = useAuth();

  // Use our data management contexts
  const productCache = useProductCache();
  const { state: productState, getProduct, preloadProducts } = productCache;

  const specCache = useSpecificationCache();
  const { state: specState, getSpecificationsSortedByCompleteness, fetchSpecifications } = specCache;

  // State for tab management
  const [activeTab, setActiveTab] = useState<string>(TABS.SPECIFICATIONS);

  // Helper function for brand matching with case insensitive comparison
  const isBrandMatch = useCallback((productBrand: string, selectedBrand: string) => {
    const productBrandLower = productBrand.toLowerCase();
    const selectedBrandLower = selectedBrand.toLowerCase();
    return productBrandLower === selectedBrandLower;
  }, []);

  // Fetch all brands from the database with stable references
  const fetchBrands = useCallback(async () => {
    // Use stable refs for state updates
    const { setBrandsLoading, setBrandsError, setDbBrands } = settersRef.current;

    setBrandsLoading(true);
    setBrandsError(null);

    try {
      const response = await fetch('/api/brands');

      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }

      const data = await response.json();
      setDbBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrandsError(error instanceof Error ? error.message : 'Failed to load brands');
    } finally {
      setBrandsLoading(false);
    }
  }, []); // Empty dependency array as we use ref for state updates

  // Store stable references to callbacks to prevent unnecessary effect re-runs
  const callbacksRef = useRef({
    fetchSpecs: fetchSpecifications,
    preloadProds: preloadProducts,
    startLoad: startLoading,
    stopLoad: stopLoading,
    getProduct: getProduct,
    isBrandMatch: isBrandMatch,
    getSpecsSorted: getSpecificationsSortedByCompleteness,
    fetchBrands: fetchBrands
  });

  // Update the ref values when dependencies change
  useEffect(() => {
    callbacksRef.current = {
      fetchSpecs: fetchSpecifications,
      preloadProds: preloadProducts,
      startLoad: startLoading,
      stopLoad: stopLoading,
      getProduct: getProduct,
      isBrandMatch: isBrandMatch,
      getSpecsSorted: getSpecificationsSortedByCompleteness,
      fetchBrands: fetchBrands
    };
  }, [fetchSpecifications, preloadProducts, startLoading, stopLoading, getProduct, isBrandMatch, getSpecificationsSortedByCompleteness, fetchBrands]);

  // Extract data from context states with deep memoization to prevent render loops
  const products = useMemo(() => {
    return Array.from(productState.products.values());
  }, [productState.products]); // Only depend on the Map reference, not its contents

  // Use specifications from the state with stable reference
  const specifications = useMemo(() => {
    // Use the stable reference to getSpecificationsSortedByCompleteness
    return callbacksRef.current.getSpecsSorted();
  }, [productState.products.size, specState.specifications ? Object.keys(specState.specifications).length : 0]); // Only recompute when collections change size

  // Memoize loading and error states to prevent render loops from isLoadingSection changes
  const loadingAndErrorState = useMemo(() => {
    return {
      specLoading: specState.isLoading || isLoadingSection('specifications'),
      specError: specState.error,
      productLoading: productState.isLoadingBatch || isLoadingSection('products'),
      productError: productState.error
    };
  }, [specState.isLoading, specState.error, productState.isLoadingBatch, productState.error, isLoadingSection]);

  // Destructure for easier usage in component
  const { specLoading, specError, productLoading, productError } = loadingAndErrorState;

  // State for database brands
  const [dbBrands, setDbBrands] = useState<Array<{ id: number, name: string }>>([]);
  const [brandsLoading, setBrandsLoading] = useState<boolean>(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  // Create refs for state setters to maintain stable references
  const settersRef = useRef({
    setDbBrands,
    setBrandsLoading,
    setBrandsError
  });

  // Update state setter refs when they change
  useEffect(() => {
    settersRef.current = {
      setDbBrands,
      setBrandsLoading,
      setBrandsError
    };
  }, [setDbBrands, setBrandsLoading, setBrandsError]);

  // Filter state
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stable event handlers for search and filter changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleBrandFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrandFilter(e.target.value);
  }, []);

  // Derived lists of unique brands for filter dropdowns - memoized to prevent render loops
  const specBrands = useMemo(() => {
    // Only recalculate when the length of specifications changes or stable key set changes
    // This avoids re-renders when specification contents change but structure remains same
    const brands = specifications
      .filter(spec => spec.product_brand) // Filter out specs with null product_brand
      .map(spec => spec.product_brand!.name);
    return Array.from(new Set(brands)).sort().map(name => ({ id: name, label: name }));
  }, [specifications.length]); // Only depend on the length, not the array reference itself

  // Use the database brands for the product dropdown - memoized to prevent render loops
  const productBrands = useMemo(() => {
    // Only recalculate when the length of dbBrands changes
    // This prevents unnecessary re-renders when array reference changes but data is the same
    return dbBrands.map(brand => ({ id: brand.name, label: brand.name }));
  }, [dbBrands.length]); // Only depend on the length, not the array reference itself

  // Tabs definition - memoized to prevent unnecessary re-renders
  const tabs = useMemo(() => {
    return [
      { id: TABS.SPECIFICATIONS, label: 'My Specifications', count: specifications.length },
      { id: TABS.PRODUCTS, label: 'Available Products', count: products.length }
    ] as Tab[];
  }, [specifications.length, products.length]); // Only re-create when counts change


  // Apply filters to specifications
  const filteredSpecifications = useMemo(() => {
    // Use stable references from callbacksRef
    const { isBrandMatch, getProduct } = callbacksRef.current;

    return specifications.filter(spec => {
      // Brand filter check
      const matchesBrand = brandFilter === '' ||
        (spec.product_brand && isBrandMatch(spec.product_brand.name, brandFilter));

      // Search query check
      let matchesSearch = searchQuery.trim() === '';
      if (!matchesSearch && spec.product) {
        // Use product data directly from the specification if available
        matchesSearch = spec.product.title.toLowerCase().includes(searchQuery.toLowerCase());
      } else if (!matchesSearch && spec.shopify_handle) {
        // Get product title from cache if available, otherwise use handle
        const product = getProduct(spec.shopify_handle);
        const productTitle = product ? product.title : (spec.shopify_handle || '');
        matchesSearch = productTitle.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return matchesBrand && matchesSearch;
    });
  }, [specifications, searchQuery, brandFilter, callbacksRef]); // Only depend on callbacksRef, not individual functions

  const filteredProducts = useMemo(() => {
    // Use stable reference from callbacksRef
    const { isBrandMatch } = callbacksRef.current;

    return products.filter(product => {
      const matchesSearch = searchQuery.trim() === '' ||
        product.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand = brandFilter === '' ||
        isBrandMatch(product.brand || product.vendor || '', brandFilter);

      return matchesSearch && matchesBrand;
    });
  }, [products, searchQuery, brandFilter, callbacksRef]); // Only depend on callbacksRef, not individual functions

  // Handle tab change with useCallback to prevent unnecessary re-renders
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    // Reset filters when switching tabs for better UX
    setBrandFilter('');
    setSearchQuery('');
  }, []);

  // Fetch specifications for the current user
  // Note: fetchBrands function is defined at the top with optimized state refs

  // Load specifications and related product data with minimal dependencies
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      // Use stable references from callbacksRef to prevent render loops
      const { fetchSpecs, preloadProds, startLoad, stopLoad } = callbacksRef.current;

      try {
        // Start loading section
        startLoad('specifications');

        // Fetch specifications for the current user
        await fetchSpecs(user.id);

        if (!isMounted) return;

        // Initialize progressive product loading
        // This will load an initial batch and start background loading
        await preloadProds(user.id);
      } finally {
        if (isMounted) {
          stopLoad('specifications');
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user, callbacksRef]); // Only depend on user and callbacksRef, not on individual functions

  // Fetch brands when component mounts - use stable reference to avoid render loops
  useEffect(() => {
    // Use stable reference from callbacksRef instead of the direct function
    callbacksRef.current.fetchBrands();
  }, []); // Empty dependency array as we're using the ref

  // Update when brand filter changes
  useEffect(() => {
    // This hook can be used for any side effects when brand filter changes
  }, [brandFilter]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab navigation */}
          <TabGroup
            tabs={tabs}
            activeTabId={activeTab}
            onChange={handleTabChange}
            className="mb-6"
          />

          {/* Filters and search */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Search
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products..."
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-64">
              <select
                id="brand-filter"
                className="border border-gray-300 rounded-md w-full p-2 text-black"
                value={brandFilter}
                onChange={handleBrandFilterChange}
                disabled={activeTab === TABS.PRODUCTS && brandsLoading}
              >
                <option value="">All Brands</option>
                {brandsLoading && activeTab === TABS.PRODUCTS ? (
                  <option value="" disabled>Loading brands...</option>
                ) : brandsError && activeTab === TABS.PRODUCTS ? (
                  <option value="" disabled>Error loading brands</option>
                ) : (activeTab === TABS.SPECIFICATIONS ? specBrands : productBrands).map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.label}</option>
                ))}
              </select>
              {brandsError && activeTab === TABS.PRODUCTS && (
                <p className="text-red-500 text-xs mt-1">{brandsError}</p>
              )}
            </div>
          </div>

          {/* Specifications tab content */}
          {activeTab === TABS.SPECIFICATIONS && (
            <div className="space-y-6">
              {specLoading ? (
                <LoadingSpinner text="Loading specifications..." />
              ) : specError ? (
                <Card>
                  <div className="border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{specError}</p>
                  </div>
                </Card>
              ) : filteredSpecifications.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    {specifications.length === 0 ? (
                      <>
                        <p className="text-divider mb-4">You haven&apos;t created any specifications yet.</p>
                        <button
                          onClick={() => handleTabChange(TABS.PRODUCTS)}
                          className="px-4 py-2 bg-button-blue text-text rounded-md hover:bg-opacity-90 transition-colors"
                        >
                          Browse Available Products
                        </button>
                      </>
                    ) : (
                      <p className="text-divider">No specifications match your filters.</p>
                    )}
                  </div>
                </Card>
              ) : (
                <div className={activeTab === 'specifications' ? 'block' : 'hidden'}>
                  {filteredSpecifications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSpecifications.map((spec) => (
                        <SpecificationCard
                          key={spec.id}
                          specification={spec}
                          isProductLoading={spec.product ? false : productCache.isProductLoading(spec.shopify_handle)}
                        />
                      ))}
                      {/* Removed failed products UI - errors will now be properly logged to console */}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-10">
                      {specState.isLoading
                        ? 'Loading specifications...'
                        : 'No specifications found for the selected brand.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Products tab content */}
          {activeTab === TABS.PRODUCTS && (
            <div className="space-y-6">
              {/* Only show loading spinner when first loading products and none are yet available */}
              {productState.loadingHandles.size > 0 && productState.products.size === 0 ? (
                <LoadingSpinner text="Loading products..." />
              ) : productState.error ? (
                <Card>
                  <div className="border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{productState.error}</p>
                  </div>
                </Card>
              ) : filteredProducts.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    {products.length === 0 ? (
                      <p className="text-divider">There are no products available for specification at this time.</p>
                    ) : (
                      <p className="text-divider">No products match your filters.</p>
                    )}
                  </div>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                    {/* Show loading placeholders for products that are being fetched */}
                    {Array.from(productCache.state.loadingHandles).map(handle => (
                      <ProductCard
                        key={`loading-${handle}`}
                        product={undefined}
                        isLoading={true}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
