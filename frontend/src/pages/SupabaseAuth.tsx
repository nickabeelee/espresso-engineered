// src/pages/SupabaseAuth.tsx
import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';

export default function SupabaseAuth() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Local view state: either sign-in or update-password
  const [view, setView] = useState<'sign_in' | 'update_password'>('sign_in');

  // 1) Redirect inside the app when Supabase signals SIGNED_IN
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession) {
          navigate('/', { replace: true });
        }
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 2) If we already have a session (on initial load), go home
  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  // 3) Switch to the “update_password” view when the URL says recovery
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'recovery') {
      setView('update_password');
    } else {
      setView('sign_in');
    }
  }, [location.search]);

  // 4) Render the Supabase Auth UI, with in-app redirects
  return (
    <div className="flex items-center justify-center h-screen bg-brown-50">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}           // add social providers here if desired
        socialLayout="horizontal"
        view={view}              // 'sign_in' or 'update_password'
      // no redirectTo prop = we handle routing in-app
      />
    </div>
  );
}
