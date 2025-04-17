import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from URL
  useEffect(() => {
    console.log('ResetPassword page loaded');
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    console.log('Search params:', window.location.search);
    
    // Try to extract from hash (SPA format)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    
    // Log extracted values
    console.log('Hash params:', { 
      accessToken: accessToken ? 'present' : 'not found',
      refreshToken: refreshToken ? 'present' : 'not found',
      type
    });
    
    // Check if we have a recovery token in the hash
    if (type === 'recovery') {
      console.log('Recovery flow detected in hash params');
    }
    
    // Also try to get from search params (non-SPA format)
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const searchType = searchParams.get('type');
    
    // Log search params
    console.log('Search params:', { 
      token: token ? 'present' : 'not found',
      type: searchType
    });
    
    if (searchType === 'recovery') {
      console.log('Recovery flow detected in search params');
    }
    
    // No need to do anything else - Supabase's auth state change will handle the session
  }, [location]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Validate passwords
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to update password');
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('Password update error:', error);
        setError(error.message);
      } else {
        console.log('Password updated successfully');
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Unexpected error during password update:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Password updated successfully! Redirecting to login...
        </div>
      ) : (
        <form onSubmit={handleReset}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
      )}
      
      <div className="mt-4 text-center">
        <a href="/login" className="text-blue-500 hover:text-blue-700">
          Back to Login
        </a>
      </div>
    </div>
  );
}