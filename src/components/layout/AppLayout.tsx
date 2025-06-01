'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { LoadingProvider } from '@/lib/loading/context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <LoadingProvider>
      <div className="min-h-screen flex flex-col bg-content-bg">
        {/* Header */}
        <header className="bg-card-bg border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-text">Spec Builder</h1>
              </div>
              
              {user && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-divider">
                    {user.name || user.email}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-link hover:text-link hover:opacity-80"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </LoadingProvider>
  );
};

export default AppLayout;
