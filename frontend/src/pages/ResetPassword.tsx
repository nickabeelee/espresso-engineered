// src/pages/ResetPassword.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const processResetLink = async () => {
      try {
        // 1) Grab the token from the query string
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token_hash');
        if (!token) {
          setError('Missing reset token.');
          setLoading(false);
          setTimeout(() => navigate('/request-password-reset'), 2000);
          return;
        }

        // 2) Verify the recovery token with Supabase
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: token,
        });

        if (verifyError || !data.session) {
          setError('Invalid or expired password reset link. Please request a new one.');
          setLoading(false);
          setTimeout(() => navigate('/request-password-reset'), 2000);
          return;
        }

        // 3) Token is valid → show the reset form
        setValid(true);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        setTimeout(() => navigate('/request-password-reset'), 2000);
      } finally {
        setLoading(false);
      }
    };

    processResetLink();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 4) Update the user’s password
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // 5) Success → redirect to login
    navigate('/login', { replace: true });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="mb-4 text-lg">Verifying reset link…</p>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Reset Error</h1>
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={() => navigate('/request-password-reset')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Request New Link
        </button>
      </div>
    );
  }

  // Valid token → show form
  if (valid) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700">New Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              minLength={6}
            />
          </label>
          <button
            type="submit"
            disabled={!password || loading}
            className={`w-full py-2 text-white rounded ${password
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
              }`}
          >
            {loading ? 'Updating…' : 'Reset Password'}
          </button>
        </form>
      </div>
    );
  }

  // Fallback (shouldn't hit)
  return null;
}
