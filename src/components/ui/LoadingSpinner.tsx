import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  inline = false,
  text = 'Loading...'
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  const containerClasses = inline 
    ? 'inline-flex items-center' 
    : 'flex flex-col items-center justify-center min-h-[100px]';

  return (
    <div className={containerClasses}>
      <div 
        className={`${sizeClasses[size]} rounded-full border-blue-500 border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-2 text-gray-500 text-sm">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
