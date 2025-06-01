'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
    } else if (!isLoading && requireAdmin && user?.role !== 'admin') {
      // Redirect to specifications if not admin but authenticated
      router.push('/specifications');
    }
  }, [user, isLoading, router, requireAdmin]);

  // Show nothing while loading or if not authenticated
  if (isLoading || !user) {
    return null;
  }

  // Show nothing if admin required but user is not admin
  if (requireAdmin && user.role !== 'admin') {
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}
