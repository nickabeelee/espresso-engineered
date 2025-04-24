// src/pages/SupabaseAuth.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';

export default function SupabaseAuth() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // 1. Pull params from both query and hash (some flows use one or the other)
        const url = new URL(window.location.href);
        const query = new URLSearchParams(url.search);
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        // merge them, with query taking precedence
        const params = new URLSearchParams([...hashParams, ...query]);
        
        const actionType = params.get('type');
        const token = params.get('token_hash');

        if (actionType === 'recovery' && token) {
          // 2. Redirect to your ResetPassword page, preserving the token in query
          window.location.replace(`/reset-password?token_hash=${encodeURIComponent(token)}`);
          return;
        }

        // 3. Otherwise, see if the user is now signed in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Signed in → go home
          window.location.replace('/');
          return;
        }

        // No session & not a recovery flow → show an error or fallback
        setError('Authentication completed, but no active session was found. Please sign in again.');
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during authentication.');
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
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
