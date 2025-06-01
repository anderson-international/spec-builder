import React from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';

interface ProductCardProps {
  id: string;
  title: string;
  brand: string;
  imageUrl: string;
  productUrl: string;
  onSelect?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  brand,
  imageUrl,
  productUrl,
  onSelect,
}) => {
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
        <div className="heading-secondary">{brand}</div>
        <h3 className="heading-primary line-clamp-2">{title}</h3>
      </div>
      
      <div className="mt-auto flex gap-2">
        <a 
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-link hover:text-opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          View on website
        </a>
        
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
