import React from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { ShopifyProduct } from '@/lib/data-management/types';

interface ProductCardProps {
  product?: ShopifyProduct;
  onSelect?: () => void;
  isLoading?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isLoading = false,
}) => {
  // Render loading state
  if (isLoading) {
    return (
      <Card 
        className="flex flex-col h-full animate-pulse" 
        padding="small"
      >
        <div className="relative aspect-square w-full mb-3 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="mt-auto flex gap-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="ml-auto h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }
  
  // Make sure product exists
  if (!product) {
    return null;
  }
  
  // Extract needed properties
  const { title, vendor, brand, featuredImage, onlineStoreUrl } = product;
  const displayBrand = brand || vendor || '';
  const imageUrl = featuredImage?.url || '';
  
  // Render normal product card
  return (
    <Card 
      className="flex flex-col h-full"
      padding="small"
      hoverEffect={true}
    >
      <div className="relative aspect-square w-full mb-3 bg-border bg-opacity-10 rounded">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain rounded"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-divider">
            No image
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className="heading-secondary">{displayBrand}</div>
        <h3 className="heading-primary line-clamp-2">{title}</h3>
      </div>
      
      <div className="mt-auto flex gap-2">
        {onlineStoreUrl && (
          <a 
            href={onlineStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-link hover:text-opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            View on website
          </a>
        )}
        
        {onSelect && (
          <button
            onClick={onSelect}
            className="ml-auto px-3 py-1 tag-primary font-medium hover:bg-opacity-30"
          >
            Request Spec
          </button>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
