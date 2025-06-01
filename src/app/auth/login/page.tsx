'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useLoading } from '@/lib/loading/context';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LoginPage() {
  const [users, setUsers] = useState<Array<{id: string, name: string | null, email: string, role: string}>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  
  const router = useRouter();
  const auth = useAuth();
  const { startLoading, stopLoading, isLoadingSection } = useLoading();
  
  // Redirect if already logged in
  useEffect(() => {
    if (auth.user) {
      router.push('/specifications');
    }
  }, [auth.user, router]);
  
  // Fetch available users for development mode
  useEffect(() => {
    const fetchUsers = async () => {
      startLoading('fetchUsers');
      try {
        const response = await fetch('/api/auth/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'Failed to load users');
      } finally {
        stopLoading('fetchUsers');
      }
    };
    
    fetchUsers();
  }, [startLoading, stopLoading]);
  
  // Handle login
  const handleLogin = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }
    
    setError(null);
    setIsLoggingIn(true);
    startLoading('login');
    
    try {
      await auth.login(selectedUserId);
      router.push('/specifications');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      setIsLoggingIn(false);
      stopLoading('login');
    }
  };
  
  // If already logged in, show nothing (will redirect)
  if (auth.user) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-content-bg">
      <Card className="max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text">Spec Builder</h1>
          <p className="text-divider mt-2">Select a user to continue</p>
        </div>
        
        {isLoadingSection('fetchUsers') ? (
          <div className="py-6 text-center text-text">
            <LoadingSpinner text="Loading users..." size="medium" />
          </div>
        ) : error ? (
          <div className="border border-red-400 bg-red-400 bg-opacity-10 text-text px-4 py-3 rounded mb-4" role="alert">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label htmlFor="user-select" className="block mb-2 text-sm font-medium text-text">
                Select User (Development Mode)
              </label>
              <select
                id="user-select"
                className="input block w-full text-base"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isLoggingIn}
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} ({user.role})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-meta">
                This simplified login is for development purposes only.
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                className={`btn btn-blue w-full py-3 ${isLoggingIn ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleLogin}
                disabled={!selectedUserId || isLoggingIn || isLoadingSection('login')}
              >
                {isLoggingIn || isLoadingSection('login') ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="small" inline={true} />
                    <span className="ml-2">Logging in...</span>
                  </span>
                ) : 'Login'}
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
