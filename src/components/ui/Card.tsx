import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
  hoverEffect?: boolean;
  fullWidth?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  onClick, 
  padding = 'medium',
  border = false,
  hoverEffect = false,
  fullWidth = true
}: CardProps) {
  // Define padding classes based on the padding prop
  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-4 md:p-6',
    large: 'p-6 md:p-8'
  };
  
  // Build the class string
  const classes = [
    'card',
    paddingClasses[padding],
    hoverEffect ? 'transition-transform hover:scale-[1.01] hover:shadow-lg' : '',
    fullWidth ? 'w-full' : '',
    onClick ? 'cursor-pointer' : '',
    className
  ].join(' ').trim();
  
  return (
    <div 
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}

export default Card;
