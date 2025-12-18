import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client for frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: browser, // Only persist session in browser
    detectSessionInUrl: true
  }
});

// Legacy helper functions - use authService instead for new code
// These are kept for backward compatibility

// Helper function to get current user's barista profile
export async function getCurrentBarista() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Get barista profile using auth user ID
  const { data, error } = await supabase
    .from('barista')
    .select('*')
    .eq('id', user.id) // Assuming barista.id maps to auth.users.id
    .single();

  if (error) {
    console.error('Failed to get barista profile:', error);
    return null;
  }

  return data;
}

// Helper function to get auth token for API calls
export async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}