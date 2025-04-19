import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';

export default function SupabaseAuth() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Check URL for auth action type first
        const url = new URL(window.location.href);
        const fragment = new URLSearchParams(url.hash.substring(1));
        const actionType = fragment.get('type');
        
        if (actionType === 'recovery') {
          // This is a password recovery flow, redirect directly to reset password
          window.location.href = '/reset-password' + url.hash;
          return;
        }
        
        // For other auth flows, check the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
        } else if (data.session) {
          // Successfully signed in, go to home
          window.location.href = '/';
        } else {
          // No session but no error either - unusual case
          // Could be a sign-up confirmation without auto-login
          setError('Authentication completed, but no session was created. Please sign in again.');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    processAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="mb-4">Processing authentication...</p>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Authentication Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-500 hover:text-blue-700">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <p className="mb-4">Redirecting...</p>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}