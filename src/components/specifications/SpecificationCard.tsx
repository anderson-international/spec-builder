import React from 'react';
import { format } from 'date-fns';
import Card from '@/components/ui/Card';
import StarRating from '@/components/ui/StarRating';

interface TastingNote {
  id: number;
  name: string;
}

interface TastingNoteWrapper {
  tasting_note: TastingNote;
}

interface SpecificationCardProps {
  id: number;
  createdAt: Date;
  brand: string;
  productName: string;
  starRating: number;
  tastingNotes: TastingNoteWrapper[];
  onClick?: () => void;
}

export const SpecificationCard: React.FC<SpecificationCardProps> = ({
  createdAt,
  brand,
  productName,
  starRating,
  tastingNotes,
  onClick,
}) => {
  const formattedDate = format(new Date(createdAt), 'MMM d, yyyy');
  
  return (
    <Card 
      className="flex flex-col h-full"
      padding="medium"
      hoverEffect={true}
      onClick={onClick}
    >
      <div className="text-meta mb-1">{formattedDate}</div>
      
      <div className="mb-2">
        <div className="heading-secondary">{brand}</div>
        <h3 className="heading-primary line-clamp-2">{productName}</h3>
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
};

export default SpecificationCard;
