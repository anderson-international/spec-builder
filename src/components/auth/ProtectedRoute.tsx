'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (
      !isLoading && 
      user && 
      allowedRoles.length > 0 && 
      !allowedRoles.includes(user.role)
    ) {
      // If user doesn't have the required role
      router.push('/unauthorized');
    }
  }, [user, isLoading, router, allowedRoles]);
  
  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <LoadingSpinner text="Checking authentication..." />
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect in the useEffect
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in the useEffect
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
