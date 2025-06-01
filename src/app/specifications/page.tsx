'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useLoading } from '@/lib/loading/context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import TabGroup, { Tab } from '@/components/ui/TabGroup';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Search from '@/components/ui/Search';
import Filter from '@/components/ui/Filter';
import SpecificationCard from '@/components/specifications/SpecificationCard';
import ProductCard from '@/components/products/ProductCard';

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

interface Specification {
  id: number;
  shopify_handle: string;
  product_brand: {
    name: string;
  };
  star_rating: number;
  created_at: string;
  tasting_notes: {
    tasting_note: TastingNote;
  }[];
  tobacco_types: {
    tobacco_type: TobaccoType;
  }[];
  cures: {
    cure: Cure;
  }[];
}

interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  brand: string;
  imageUrl: string;
  productUrl: string;
}

// Tab identifiers
const TABS = {
  SPECIFICATIONS: 'specifications',
  PRODUCTS: 'products'
};

export default function SpecificationsPage() {
  const router = useRouter();
  // We'll use the loading context in future enhancements
  const loading = useLoading();
  const { user } = useAuth();
  
  // State for tab management
  const [activeTab, setActiveTab] = useState<string>(TABS.SPECIFICATIONS);
  
  // State for specifications
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [specLoading, setSpecLoading] = useState<boolean>(true);
  const [specError, setSpecError] = useState<string | null>(null);
  
  // State for products
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productLoading, setProductLoading] = useState<boolean>(true);
  const [productError, setProductError] = useState<string | null>(null);
  
  // State for product titles
  const [productTitles, setProductTitles] = useState<Record<string, string>>({});

  // State for database brands
  const [dbBrands, setDbBrands] = useState<Array<{id: number, name: string}>>([]);
  const [brandsLoading, setBrandsLoading] = useState<boolean>(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  
  // Filter state
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Derived lists of unique brands for filter dropdowns
  const specBrands = useMemo(() => {
    const brands = specifications.map(spec => spec.product_brand.name);
    return Array.from(new Set(brands)).sort().map(name => ({ id: name, label: name }));
  }, [specifications]);
  
  // Use the database brands for the product dropdown
  const productBrands = useMemo(() => {
    return dbBrands.map(brand => ({ id: brand.name, label: brand.name }));
  }, [dbBrands]);
  
  // Helper function for fuzzy brand matching
  const isBrandMatch = useCallback((productBrand: string, selectedBrand: string) => {
    return productBrand.toLowerCase() === selectedBrand.toLowerCase();
  }, []);
  
  // Tabs definition
  const tabs: Tab[] = [
    { id: TABS.SPECIFICATIONS, label: 'My Specifications', count: specifications.length },
    { id: TABS.PRODUCTS, label: 'Available Products', count: products.length }
  ];

  // Apply filters to specifications
  const filteredSpecifications = useMemo(() => {
    return specifications.filter(spec => {
      if (brandFilter && spec.product_brand.name !== brandFilter) {
        return false;
      }
      if (searchQuery) {
        // First check if we have a product title, then fall back to handle
        const productTitle = productTitles[spec.shopify_handle] || spec.shopify_handle;
        if (!productTitle.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [specifications, brandFilter, searchQuery, productTitles]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Apply brand filter with fuzzy matching
      if (brandFilter && !isBrandMatch(product.brand, brandFilter)) {
        return false;
      }
      
      // Apply search query
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [products, brandFilter, searchQuery, isBrandMatch]);
  
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
  
  // Fetch product titles by handles
  const fetchProductTitles = async (specs: Specification[]) => {
    if (!specs.length) return;
    
    const handles = specs.map(spec => spec.shopify_handle).filter(Boolean);
    
    try {
      const response = await fetch('/api/products/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handles })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProductTitles(prev => ({...prev, ...data}));
      } else {
        console.error('Failed to fetch product titles:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching product titles:', error);
    }
  };

  useEffect(() => {
    const fetchSpecifications = async () => {
      if (!user) return;
      
      setSpecLoading(true);
      setSpecError(null);
      
      try {
        // Start by loading a small batch
        const response = await fetch(`/api/specifications?userId=${user.id}&limit=50`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch specifications');
        }
        
        const initialSpecs = await response.json();
        setSpecifications(initialSpecs);
        
        // Fetch titles for initial specifications
        await fetchProductTitles(initialSpecs);
        
        // Load the rest in the background
        const allResponse = await fetch(`/api/specifications?userId=${user.id}`);
        if (allResponse.ok) {
          const allSpecs = await allResponse.json();
          setSpecifications(allSpecs);
          
          // Fetch titles for all specifications
          await fetchProductTitles(allSpecs);
        }
      } catch (error) {
        console.error('Error fetching specifications:', error);
        setSpecError(error instanceof Error ? error.message : 'Failed to load specifications');
      } finally {
        setSpecLoading(false);
      }
    };
    
    fetchSpecifications();
  }, [user]);
  
  // Fetch brands when component mounts
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Fetch available products
  const fetchProducts = useCallback(async () => {
    if (!user || activeTab !== TABS.PRODUCTS) return;
    
    setProductLoading(true);
    setProductError(null);
    
    try {
      // Fetch products that don't have specifications yet
      const response = await fetch(`/api/products/available?userId=${user.id}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available products');
      }
      
      const data = await response.json();
      setProducts(data);
      
      // Load the rest in the background
      const allResponse = await fetch(`/api/products/available?userId=${user.id}`);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setProducts(allData);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductError(error instanceof Error ? error.message : 'Failed to load available products');
    } finally {
      setProductLoading(false);
    }
  }, [user, activeTab]);
  
  // Fetch products when tab changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSpecifications.map((spec) => (
                    <SpecificationCard
                      key={spec.id}
                      id={spec.id}
                      createdAt={new Date(spec.created_at)}
                      brand={spec.product_brand.name}
                      productName={productTitles[spec.shopify_handle] || spec.shopify_handle}
                      starRating={spec.star_rating}
                      tastingNotes={(spec.tasting_notes || []) as unknown as TastingNoteWrapper[]}
                      onClick={() => router.push(`/specifications/${spec.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Products tab content */}
          {activeTab === TABS.PRODUCTS && (
            <div className="space-y-6">
              {productLoading ? (
                <LoadingSpinner text="Loading available products..." />
              ) : productError ? (
                <Card>
                  <div className="border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{productError}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      brand={product.brand}
                      imageUrl={product.imageUrl}
                      productUrl={product.productUrl}
                      onSelect={() => console.log('Selected product for spec:', product.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
