'use client';

import React from 'react';
import { ProductProvider } from '@/lib/data-management/productCache';
import { SpecificationProvider } from '@/lib/data-management/specificationCache';
import { LoadingProvider } from '@/lib/data-management/loadingContext';

// Combined data provider that wraps all our context providers
export function DataProvider({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <ProductProvider>
        <SpecificationProvider>
          {children}
        </SpecificationProvider>
      </ProductProvider>
    </LoadingProvider>
  );
}
