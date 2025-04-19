import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValidResetLink, setIsValidResetLink] = useState(false);
  
  const navigate = useNavigate();
  
  // Check authentication state when component loads
  useEffect(() => {
    const processResetRequest = async () => {
      try {
        // Get the current session and check if we're in recovery mode
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError('Authentication error. Please try again using the reset link from your email.');
          setIsValidResetLink(false);
          return;
        }

        if (session) {
          // We have a valid session
          setIsValidResetLink(true);
        } else {
          // Check if there's a recovery flow in progress via URL parameters
          const url = new URL(window.location.href);
          const params = new URLSearchParams(url.hash.substring(1));
          
          if (params.get('type') === 'recovery') {
            // Valid recovery flow detected
            setIsValidResetLink(true);
          } else {
            // Not a valid reset flow
            setError('Invalid or expired password reset link. Please request a new one.');
            setIsValidResetLink(false);
            setTimeout(() => {
              navigate('/request-password-reset');
            }, 2000);
          }
        }
      } catch (err) {
        setError('Authentication error. Please try again using the reset link from your email.');
        setIsValidResetLink(false);
      } finally {
        setLoading(false);
      }
    };
    
    processResetRequest();
  }, [navigate]);

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
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="mb-4">Processing reset request...</p>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

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
        isValidResetLink && (
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
        )
      )}
      
      <div className="mt-4 text-center">
        <a href="/login" className="text-blue-500 hover:text-blue-700">
          Back to Login
        </a>
      </div>
    </div>
  );
}