import React from 'react';
import { format } from 'date-fns';
import Card from '@/components/ui/Card';
import StarRating from '@/components/ui/StarRating';
import { SpecificationWithProduct } from '@/lib/data-management/specification';

interface SpecificationCardProps {
  specification: SpecificationWithProduct;
  onClick?: () => void;
  isProductLoading?: boolean;
}

// Use React.memo to prevent unnecessary re-renders when props haven't meaningfully changed
export const SpecificationCard: React.FC<SpecificationCardProps> = React.memo(({ 
  specification,
  onClick,
  isProductLoading = false,
}) => {
  const formattedDate = format(new Date(specification.created_at), 'MMM d, yyyy');
  const productName = specification.product ? specification.product.title : specification.shopify_handle;
  const brand = specification.product_brand?.name || 'Unknown Brand';
  const starRating = specification.star_rating || 0;
  const tastingNotes = specification.tasting_notes || [];

  // Handle click to view specification details
  const handleClick = onClick || (() => {});
  
  return (
    <Card 
      className="flex flex-col h-full"
      padding="medium"
      hoverEffect={true}
      onClick={handleClick}
    >
      <div className="text-meta mb-1">{formattedDate}</div>
      
      <div className="mb-2">
        <div className="heading-secondary">{brand}</div>
        <h3 className="heading-primary line-clamp-2">
          {productName}
          {isProductLoading && (
            <span className="ml-2 inline-block w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></span>
          )}
        </h3>
      </div>
      
      <StarRating rating={starRating} size="small" className="mb-3" />
      
      {tastingNotes.length > 0 && (
        <div className="mt-auto">
          <div className="text-meta mb-1">Tasting Notes</div>
          <div className="flex flex-wrap gap-1">
            {tastingNotes.slice(0, 3).map((note, index) => (
              <span 
                key={index}
                className="tag-primary"
              >
                {note.tasting_note.name}
              </span>
            ))}
            {tastingNotes.length > 3 && (
              <span className="tag-secondary">
                +{tastingNotes.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Return true if nothing important changed (prevents re-render)
  // This optimizes rendering by only updating when meaningful changes occur
  return (
    prevProps.specification.id === nextProps.specification.id &&
    prevProps.isProductLoading === nextProps.isProductLoading &&
    // Only compare product ids if both have products
    ((!prevProps.specification.product && !nextProps.specification.product) ||
     (prevProps.specification.product?.id === nextProps.specification.product?.id)) &&
    // Only re-render if completion percentage changes
    prevProps.specification.completion_percent === nextProps.specification.completion_percent
  );
});

export default SpecificationCard;
