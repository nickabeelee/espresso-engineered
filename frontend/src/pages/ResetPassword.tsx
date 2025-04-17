import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in a recovery flow and establish the session
  useEffect(() => {
    console.log('ResetPassword page loaded');
    console.log('Current URL:', window.location.href);
    
    const processRecoveryFlow = async () => {
      try {
        // Check if we're in a recovery flow
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const searchType = searchParams.get('type');
        const hashType = hashParams.get('type');
        
        // Log for debugging
        console.log('Recovery detection - Search type:', searchType, 'Hash type:', hashType);
        
        if (searchType === 'recovery' || hashType === 'recovery') {
          console.log('Recovery flow detected!');
          setIsRecoveryFlow(true);
          
          // Get the current user to see if we're authenticated
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error getting user:', userError);
            setError('Authentication error. Please try clicking the reset link again.');
          } else if (!user) {
            console.log('No authenticated user found, trying to exchange token...');
            
            // If redirected with a token but not authenticated yet, try to exchange the token
            const { error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('Error establishing session:', sessionError);
              setError('Unable to verify your identity. Please try clicking the reset link again.');
            }
          } else {
            console.log('Successfully authenticated as:', user.email);
          }
        } else {
          // Not a recovery flow, redirect to request reset
          console.log('Not a recovery flow - redirecting');
          navigate('/request-password-reset');
        }
      } catch (err) {
        console.error('Unexpected error in recovery flow:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    };
    
    processRecoveryFlow();
  }, [navigate, location]);

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