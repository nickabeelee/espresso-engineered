import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Barista } from '@shared/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'profile_missing' | 'error';

// Auth state stores
export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const barista = writable<Barista | null>(null);
export const authStatus = writable<AuthStatus>('loading');
export const authError = writable<string | null>(null);

// Derived stores for convenience
export const isAuthenticated: Readable<boolean> = derived(
  [user, barista, authStatus],
  ([$user, $barista, $status]) => $status === 'authenticated' && !!$user && !!$barista
);

export const isLoading: Readable<boolean> = derived(authStatus, ($status) => $status === 'loading');

// Authentication service class
class AuthService {
  private initialized = false;
  private initializing: Promise<(() => void) | void> | null = null;
  private profileLoadPromise: Promise<AuthStatus> | null = null;
  private profileUserId: string | null = null;

  async initialize() {
    if (this.initialized || !browser) return;
    if (this.initializing) {
      return this.initializing;
    }

    this.initializing = (async () => {
      let unsubscribe: (() => void) | null = null;
      const loadingTimeout = setTimeout(() => {
        console.warn('Auth initialization timed out.');
        authStatus.set('error');
        authError.set('Auth initialization timed out. Please refresh and try again.');
      }, 8000);

      try {
        authStatus.set('loading');
        authError.set(null);

        const applySession = async (currentSession: Session | null, event?: string) => {
          session.set(currentSession);
          user.set(currentSession?.user ?? null);

          if (!currentSession?.user) {
            barista.set(null);
            this.profileUserId = null;
            this.profileLoadPromise = null;
            authStatus.set('unauthenticated');
            authError.set(null);
            return;
          }

          const userId = currentSession.user.id;
          const shouldReloadProfile = event === 'SIGNED_IN'
            || event === 'INITIAL_SESSION'
            || event === 'USER_UPDATED'
            || this.profileUserId !== userId
            || !this.getCurrentBarista();

          if (event === 'TOKEN_REFRESHED' && !shouldReloadProfile) {
            authStatus.set('authenticated');
            return;
          }

          authStatus.set('loading');
          const timeoutMs = event === 'SIGNED_IN' ? 15000 : 8000;
          const status = await this.loadBaristaProfile(userId, timeoutMs);
          authStatus.set(status);
        };

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth state changed:', event, newSession?.user?.id);
            await applySession(newSession ?? null, event);
          }
        );
        unsubscribe = () => subscription.unsubscribe();

        // Check initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Failed to fetch initial session:', error);
          authStatus.set('error');
          authError.set('Unable to read auth session. Please refresh and try again.');
          return;
        }

        await applySession(initialSession ?? null, 'INITIAL_SESSION');
      } catch (err) {
        console.error('Auth initialization failed:', err);
        authStatus.set('error');
        authError.set('Auth initialization failed. Please refresh and try again.');
      } finally {
        clearTimeout(loadingTimeout);
        this.initialized = true;
        this.initializing = null;
      }

      // Return cleanup function
      return unsubscribe ?? undefined;
    })();

    return this.initializing;
  }

  private async loadBaristaProfile(userId: string, timeoutMs = 8000): Promise<AuthStatus> {
    if (this.profileLoadPromise && this.profileUserId === userId) {
      return this.profileLoadPromise;
    }

    this.profileUserId = userId;
    this.profileLoadPromise = (async () => {
      const existingBarista = this.getCurrentBarista();
      const preserveExisting = !!existingBarista && existingBarista.id === userId;

      try {
        console.log('Loading barista profile for user:', userId);
        const loadPromise = supabase
          .from('barista')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Barista profile request timed out.')), timeoutMs);
        });
        const { data, error } = await Promise.race([loadPromise, timeoutPromise]);

        if (error) {
          console.error('Failed to load barista profile:', error);
          authError.set('Unable to load your barista profile.');
          if (preserveExisting) {
            return 'authenticated';
          }
          barista.set(null);
          return 'error';
        }

        if (!data) {
          authError.set('No barista profile found for this account.');
          if (preserveExisting) {
            return 'authenticated';
          }
          barista.set(null);
          return 'profile_missing';
        }

        console.log('Barista profile loaded:', data);
        authError.set(null);
        barista.set(data);
        return 'authenticated';
      } catch (err) {
        console.error('Error loading barista profile:', err);
        authError.set(err instanceof Error ? err.message : 'Unexpected error loading barista profile.');
        if (preserveExisting) {
          return 'authenticated';
        }
        barista.set(null);
        return 'error';
      } finally {
        this.profileLoadPromise = null;
      }
    })();

    return this.profileLoadPromise;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('Sign in successful:', data);
    return data;
  }

  async signUp(email: string, password: string, metadata?: { 
    first_name?: string; 
    last_name?: string; 
    display_name?: string; 
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    // Clear stores
    user.set(null);
    session.set(null);
    barista.set(null);
    this.profileUserId = null;
    this.profileLoadPromise = null;
    authStatus.set('unauthenticated');
    authError.set(null);
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw new Error(error.message);
    }
  }

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateProfile(updates: Partial<Barista>) {
    const currentBarista = this.getCurrentBarista();
    if (!currentBarista) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('barista')
      .update(updates)
      .eq('id', currentBarista.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    barista.set(data);
    return data;
  }

  async reloadProfile() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      authStatus.set('unauthenticated');
      authError.set(null);
      return;
    }

    authStatus.set('loading');
    authError.set(null);
    const status = await this.loadBaristaProfile(currentUser.id);
    authStatus.set(status);
  }

  getCurrentUser(): User | null {
    let currentUser: User | null = null;
    user.subscribe(u => currentUser = u)();
    return currentUser;
  }

  getCurrentBarista(): Barista | null {
    let currentBarista: Barista | null = null;
    barista.subscribe(b => currentBarista = b)();
    return currentBarista;
  }

  getCurrentSession(): Session | null {
    let currentSession: Session | null = null;
    session.subscribe(s => currentSession = s)();
    return currentSession;
  }

  async getAuthToken(): Promise<string | null> {
    const currentSession = this.getCurrentSession();
    return currentSession?.access_token ?? null;
  }
}

// Export singleton instance
export const authService = new AuthService();

// Helper functions for backward compatibility
export async function getCurrentBarista(): Promise<Barista | null> {
  return authService.getCurrentBarista();
}

export async function getAuthToken(): Promise<string | null> {
  return authService.getAuthToken();
}
