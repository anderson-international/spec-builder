import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  showEmpty?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'medium',
  showEmpty = true,
  className = '',
}) => {
  // Size classes
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl',
  };

  // Create array of stars
  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= rating;
    
    stars.push(
      <span 
        key={i} 
        className={`${isFilled ? 'text-yellow-400' : 'text-gray-300'} ${showEmpty || isFilled ? 'inline' : 'hidden'}`}
        aria-hidden="true"
      >
        ★
      </span>
    );
  }

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`} aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
      {stars}
      <span className="sr-only">{rating} out of {maxRating} stars</span>
    </div>
  );
};

export default StarRating;
