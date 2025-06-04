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
import { useCallback, useEffect, useMemo, useState } from 'react';

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

  // Extract data from context states
  const products = Array.from(productState.products.values());
  const specifications = getSpecificationsSortedByCompleteness();
  const specLoading = specState.isLoading || isLoadingSection('specifications');
  const specError = specState.error;
  const productLoading = productState.isLoadingBatch || isLoadingSection('products');
  const productError = productState.error;

  // State for database brands
  const [dbBrands, setDbBrands] = useState<Array<{ id: number, name: string }>>([]);
  const [brandsLoading, setBrandsLoading] = useState<boolean>(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  // Filter state
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Derived lists of unique brands for filter dropdowns
  const specBrands = useMemo(() => {
    const brands = specifications
      .filter(spec => spec.product_brand) // Filter out specs with null product_brand
      .map(spec => spec.product_brand!.name);
    return Array.from(new Set(brands)).sort().map(name => ({ id: name, label: name }));
  }, [specifications]);

  // Use the database brands for the product dropdown
  const productBrands = useMemo(() => {
    return dbBrands.map(brand => ({ id: brand.name, label: brand.name }));
  }, [dbBrands]);

  // Helper function for brand matching with case insensitive comparison
  const isBrandMatch = useCallback((productBrand: string, selectedBrand: string) => {
    const productBrandLower = productBrand.toLowerCase();
    const selectedBrandLower = selectedBrand.toLowerCase();
    return productBrandLower === selectedBrandLower;
  }, []);

  // Tabs definition
  const tabs: Tab[] = [
    { id: TABS.SPECIFICATIONS, label: 'My Specifications', count: specifications.length },
    { id: TABS.PRODUCTS, label: 'Available Products', count: products.length }
  ];

  // Apply filters to specifications
  const filteredSpecifications = useMemo(() => {
    return specifications.filter(spec => {
      // Brand filter check
      const matchesBrand = brandFilter === '' ||
        (spec.product_brand && isBrandMatch(spec.product_brand.name, brandFilter));

      // Search query check
      let matchesSearch = searchQuery.trim() === '';
      if (!matchesSearch) {
        // Get product title from cache if available, otherwise use handle
        const product = spec.shopify_handle ? getProduct(spec.shopify_handle) : null;
        const productTitle = product ? product.title : (spec.shopify_handle || '');
        matchesSearch = productTitle.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return matchesBrand && matchesSearch;
    });
  }, [specifications, searchQuery, brandFilter, isBrandMatch, getProduct]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchQuery.trim() === '' ||
        product.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand = brandFilter === '' ||
        isBrandMatch(product.brand || product.vendor || '', brandFilter);

      return matchesSearch && matchesBrand;
    });
  }, [products, searchQuery, brandFilter, isBrandMatch]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Reset filters when switching tabs
    setBrandFilter('');
    setSearchQuery('');
  };

  // Fetch specifications for the current user
  // Fetch all brands from the database
  const fetchBrands = useCallback(async () => {
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
  }, []);

  // Load specifications and related product data
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Start loading section
        startLoading('specifications');

        // Fetch specifications for the current user
        // The specification cache will handle fetching products for specifications
        await fetchSpecifications(user.id);
        
        // Initialize progressive product loading
        // This will load an initial batch and start background loading
        await preloadProducts(user.id);
      } finally {
        stopLoading('specifications');
      }
    };

    loadData();
  }, [user, fetchSpecifications, preloadProducts, startLoading, stopLoading]);

  // Fetch brands when component mounts
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

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
                onChange={setSearchQuery}
                placeholder="Search products..."
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-64">
              <select
                id="brand-filter"
                className="border border-gray-300 rounded-md w-full p-2 text-black"
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
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
