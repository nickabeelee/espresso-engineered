import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function SupabaseAuth() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log('SupabaseAuth: processing auth redirect');
        console.log('URL:', window.location.href);
        
        // Let Supabase handle the auth redirect
        const { error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setError(error.message);
        } else {
          console.log('Auth redirect processed successfully');
          // Redirect to reset password page if this is a recovery flow
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const type = hashParams.get('type');
          
          if (type === 'recovery') {
            console.log('Redirecting to reset password page');
            window.location.href = '/reset-password';
          } else {
            console.log('Redirecting to home');
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
        setProcessed(true);
      }
    };

    if (!processed) {
      processAuth();
    }
  }, [location, processed]);

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