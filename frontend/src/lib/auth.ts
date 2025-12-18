import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Barista } from '@shared/types';

// Auth state stores
export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const barista = writable<Barista | null>(null);
export const loading = writable(true);

// Derived stores for convenience
export const isAuthenticated: Readable<boolean> = derived(
  [user, barista],
  ([$user, $barista]) => !!$user && !!$barista
);

export const isLoading: Readable<boolean> = derived(loading, ($loading) => $loading);

// Authentication service class
class AuthService {
  private initialized = false;

  async initialize() {
    if (this.initialized || !browser) return;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        session.set(newSession);
        user.set(newSession?.user ?? null);

        if (newSession?.user) {
          // User is signed in, fetch barista profile
          await this.loadBaristaProfile(newSession.user.id);
        } else {
          // User is signed out
          barista.set(null);
        }

        loading.set(false);
      }
    );

    // Check initial session
    const { data: { session: initialSession } } = await supabase.auth.getSession();
    
    if (initialSession?.user) {
      session.set(initialSession);
      user.set(initialSession.user);
      await this.loadBaristaProfile(initialSession.user.id);
    }
    
    loading.set(false);
    this.initialized = true;

    // Return cleanup function
    return () => subscription.unsubscribe();
  }

  private async loadBaristaProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('barista')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to load barista profile:', error);
        barista.set(null);
        return;
      }

      barista.set(data);
    } catch (err) {
      console.error('Error loading barista profile:', err);
      barista.set(null);
    }
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

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