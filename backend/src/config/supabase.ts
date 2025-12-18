import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Supabase configuration for backend
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  // Create Supabase client with service role key for backend operations
  supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseInstance;
}

// Export a getter that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

// Type for JWT payload from Supabase Auth
export interface JWTPayload {
  sub: string; // auth.users.id
  email?: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
}

// Helper function to resolve auth.users.id to barista.id
export async function resolveBarista(authUserId: string) {
  const { data, error } = await supabase
    .from('barista')
    .select('*')
    .eq('id', authUserId) // Assuming barista.id maps to auth.users.id via FK
    .single();

  if (error) {
    throw new Error(`Failed to resolve barista: ${error.message}`);
  }

  return data;
}